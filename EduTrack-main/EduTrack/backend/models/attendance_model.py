from bson import ObjectId
from flask import current_app

from database.db import get_db
from database.mysql_db import get_mysql_connection


def _is_mysql_backend():
    return current_app.config.get("DB_BACKEND", "mongo").lower() in {"mysql", "both"}


def _attendance_collection():
    return get_db()["attendance"]


def _resolve_student_pk(cursor, student_identifier):
    identifier = str(student_identifier or "").strip()
    cursor.execute(
        """
        SELECT student_id, student_code
        FROM students
        WHERE student_code = %s OR enrollment_no = %s OR CAST(student_id AS CHAR) = %s
        LIMIT 1
        """,
        (identifier, identifier, identifier),
    )
    return cursor.fetchone()


def _resolve_course_id(cursor, subject):
    normalized = str(subject or "").strip()
    cursor.execute("SELECT course_id FROM courses WHERE course_name = %s LIMIT 1", (normalized,))
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute("INSERT INTO courses (course_name, faculty_id) VALUES (%s, NULL)", (normalized,))
    return cursor.lastrowid


def ensure_attendance_indexes():
    """Create required indexes for Mongo backend only."""
    if _is_mysql_backend():
        return

    collection = _attendance_collection()
    # Remove legacy unique index that blocks multiple dates for the same subject.
    try:
        collection.drop_index("student_id_1_subject_1")
    except Exception:
        pass

    collection.create_index("student_id")
    collection.create_index("subject")
    collection.create_index("date")
    collection.create_index([("student_id", 1), ("subject", 1), ("date", 1)], unique=True)


def _serialize_attendance(document):
    if not document:
        return None

    if _is_mysql_backend():
        return {
            "id": str(document.get("attendance_id")),
            "student_id": document.get("student_code") or str(document.get("student_id")),
            "subject": document.get("course_name"),
            "attended_classes": int(document.get("attended_classes") or 0),
            "total_classes": int(document.get("total_classes") or 0),
            "attendance_percentage": float(document.get("attendance_percentage") or 0.0),
        }

    return {
        "id": str(document["_id"]),
        "student_id": document.get("student_id"),
        "subject": document.get("subject"),
        "attended_classes": int(document.get("attended_classes", 0)),
        "total_classes": int(document.get("total_classes", 0)),
        "attendance_percentage": float(document.get("attendance_percentage", 0.0)),
    }


def calculate_attendance_percentage(attended_classes, total_classes):
    if total_classes <= 0:
        return 0.0
    return round((attended_classes / total_classes) * 100, 2)


def get_attendance_by_student_id(student_id):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT a.attendance_id, a.student_id, s.student_code, c.course_name,
                       SUM(CASE WHEN LOWER(a.status) = 'present' THEN 1 ELSE 0 END) AS attended_classes,
                       COUNT(*) AS total_classes,
                       IFNULL(ROUND((SUM(CASE WHEN LOWER(a.status) = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2), 0) AS attendance_percentage
                FROM attendance a
                JOIN students s ON s.student_id = a.student_id
                JOIN courses c ON c.course_id = a.course_id
                WHERE s.student_code = %s OR CAST(s.student_id AS CHAR) = %s
                GROUP BY a.student_id, c.course_id
                ORDER BY c.course_name ASC
                """,
                (str(student_id), str(student_id)),
            )
            return [_serialize_attendance(item) for item in cursor.fetchall()]
        finally:
            conn.close()

    cursor = _attendance_collection().find({"student_id": str(student_id)}).sort("subject", 1)
    return [_serialize_attendance(item) for item in cursor]


def get_attendance_by_id(attendance_id):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT a.attendance_id, a.student_id, s.student_code, c.course_name, a.date, a.status
                FROM attendance a
                JOIN students s ON s.student_id = a.student_id
                JOIN courses c ON c.course_id = a.course_id
                WHERE a.attendance_id = %s
                """,
                (int(attendance_id),),
            )
            document = cursor.fetchone()
            return _serialize_attendance_entry(document)
        finally:
            conn.close()

    try:
        document = _attendance_collection().find_one({"_id": ObjectId(attendance_id)})
        return _serialize_attendance(document)
    except Exception:
        return None


def create_attendance(payload):
    return create_attendance_entries([payload])[0]


def update_attendance(attendance_id, payload):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            values = []
            if "status" in payload:
                set_clauses.append("status = %s")
                values.append(payload["status"])
            if "date" in payload:
                set_clauses.append("date = %s")
                values.append(payload["date"])
            if not set_clauses:
                return get_attendance_by_id(attendance_id)

            values.append(int(attendance_id))
            cursor.execute(
                f"UPDATE attendance SET {', '.join(set_clauses)} WHERE attendance_id = %s",
                tuple(values),
            )
            conn.commit()
            return get_attendance_by_id(attendance_id)
        finally:
            conn.close()

    try:
        _attendance_collection().update_one({"_id": ObjectId(attendance_id)}, {"$set": payload})
        return get_attendance_by_id(attendance_id)
    except Exception:
        return None


def _serialize_attendance_entry(document):
    if not document:
        return None

    if _is_mysql_backend():
        return {
            "id": str(document.get("attendance_id")),
            "student_id": document.get("student_code") or str(document.get("student_id")),
            "subject": document.get("course_name"),
            "date": str(document.get("date")),
            "status": document.get("status"),
        }

    return {
        "id": str(document["_id"]),
        "student_id": document.get("student_id"),
        "subject": document.get("subject"),
        "date": document.get("date"),
        "status": document.get("status"),
    }


def create_attendance_entries(records):
    if not records:
        return []

    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            for item in records:
                student = _resolve_student_pk(cursor, item.get("student_id"))
                if not student:
                    continue
                course_id = _resolve_course_id(cursor, item.get("subject"))
                cursor.execute(
                    """
                    INSERT INTO attendance (student_id, course_id, date, status)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE status = VALUES(status)
                    """,
                    (student[0], course_id, item.get("date"), item.get("status")),
                )

            conn.commit()

            saved = []
            for item in records:
                student = _resolve_student_pk(cursor, item.get("student_id"))
                if not student:
                    continue
                cursor.execute(
                    """
                    SELECT a.attendance_id, a.student_id, s.student_code, c.course_name, a.date, a.status
                    FROM attendance a
                    JOIN students s ON s.student_id = a.student_id
                    JOIN courses c ON c.course_id = a.course_id
                    WHERE a.student_id = %s AND c.course_name = %s AND a.date = %s
                    LIMIT 1
                    """,
                    (student[0], str(item.get("subject")).strip(), item.get("date")),
                )
                row = cursor.fetchone()
                if row:
                    saved.append(
                        {
                            "id": str(row[0]),
                            "student_id": row[2] or str(row[1]),
                            "subject": row[3],
                            "date": str(row[4]),
                            "status": row[5],
                        }
                    )
            return saved
        finally:
            conn.close()

    collection = _attendance_collection()
    for item in records:
        collection.update_one(
            {
                "student_id": str(item.get("student_id")),
                "subject": str(item.get("subject")),
                "date": str(item.get("date")),
            },
            {"$set": {"status": item.get("status")}},
            upsert=True,
        )

    result = []
    for item in records:
        document = collection.find_one(
            {
                "student_id": str(item.get("student_id")),
                "subject": str(item.get("subject")),
                "date": str(item.get("date")),
            }
        )
        if document:
            result.append(_serialize_attendance_entry(document))

    return result


def get_attendance_entries_by_student(student_id):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT a.attendance_id, a.student_id, s.student_code, c.course_name, a.date, a.status
                FROM attendance a
                JOIN students s ON s.student_id = a.student_id
                JOIN courses c ON c.course_id = a.course_id
                WHERE s.student_code = %s OR CAST(s.student_id AS CHAR) = %s
                ORDER BY a.date DESC
                """,
                (str(student_id), str(student_id)),
            )
            return [_serialize_attendance_entry(item) for item in cursor.fetchall()]
        finally:
            conn.close()

    cursor = _attendance_collection().find({"student_id": str(student_id)}).sort("date", -1)
    return [_serialize_attendance_entry(item) for item in cursor]