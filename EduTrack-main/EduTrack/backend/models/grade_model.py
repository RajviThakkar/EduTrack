from bson import ObjectId
from flask import current_app

from database.db import get_db
from database.mysql_db import get_mysql_connection


def _is_mysql_backend():
    return current_app.config.get("DB_BACKEND", "mongo").lower() in {"mysql", "both"}


def _grades_collection():
    return get_db()["grades"]


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


def ensure_grade_indexes():
    """Create indexes for Mongo backend only."""
    if _is_mysql_backend():
        return
    _grades_collection().create_index([("student_id", 1), ("subject", 1)], unique=True)


def _serialize_grade(document):
    if not document:
        return None

    if _is_mysql_backend():
        return {
            "id": str(document.get("grade_id")),
            "student_id": document.get("student_code") or str(document.get("student_id")),
            "subject": document.get("course_name"),
            "internal_marks": float(document.get("internal_marks") or 0.0),
            "external_marks": float(document.get("external_marks") or 0.0),
            "assignment_score": float(document.get("assignment_score") or 0.0),
            "total_marks": float(document.get("total_marks") or 0.0),
            "grade": document.get("grade"),
        }

    return {
        "id": str(document["_id"]),
        "student_id": document.get("student_id"),
        "subject": document.get("subject"),
        "internal_marks": float(document.get("internal_marks", 0.0)),
        "external_marks": float(document.get("external_marks", 0.0)),
        "assignment_score": float(document.get("assignment_score", 0.0)),
        "total_marks": float(document.get("total_marks", 0.0)),
        "grade": document.get("grade"),
    }


def calculate_grade(total_marks):
    if total_marks >= 85:
        return "A+"
    if total_marks >= 75:
        return "A"
    if total_marks >= 65:
        return "B"
    if total_marks >= 55:
        return "C"
    if total_marks >= 45:
        return "D"
    return "F"


def get_grades_by_student_id(student_id):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT g.grade_id, g.student_id, s.student_code, c.course_name,
                       g.internal_marks, g.external_marks, g.assignment_score, g.total_marks, g.grade
                FROM grades g
                JOIN students s ON s.student_id = g.student_id
                JOIN courses c ON c.course_id = g.course_id
                WHERE s.student_code = %s OR CAST(s.student_id AS CHAR) = %s
                ORDER BY c.course_name ASC
                """,
                (str(student_id), str(student_id)),
            )
            return [_serialize_grade(item) for item in cursor.fetchall()]
        finally:
            conn.close()

    cursor = _grades_collection().find({"student_id": str(student_id)}).sort("subject", 1)
    return [_serialize_grade(item) for item in cursor]


def get_grade_by_id(grade_id):
    if _is_mysql_backend():
        try:
            normalized_id = int(grade_id)
        except (TypeError, ValueError):
            return None

        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT g.grade_id, g.student_id, s.student_code, c.course_name,
                       g.internal_marks, g.external_marks, g.assignment_score, g.total_marks, g.grade
                FROM grades g
                JOIN students s ON s.student_id = g.student_id
                JOIN courses c ON c.course_id = g.course_id
                WHERE g.grade_id = %s
                LIMIT 1
                """,
                (normalized_id,),
            )
            return _serialize_grade(cursor.fetchone())
        finally:
            conn.close()

    try:
        document = _grades_collection().find_one({"_id": ObjectId(grade_id)})
        return _serialize_grade(document)
    except Exception:
        return None


def create_grade(payload):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            student = _resolve_student_pk(cursor, payload.get("student_id"))
            if not student:
                return None
            course_id = _resolve_course_id(cursor, payload.get("subject"))

            cursor.execute(
                """
                INSERT INTO grades (
                    student_id, course_id, internal_marks, external_marks,
                    assignment_score, total_marks, grade
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    student[0],
                    course_id,
                    float(payload.get("internal_marks") or 0.0),
                    float(payload.get("external_marks") or 0.0),
                    float(payload.get("assignment_score") or 0.0),
                    float(payload.get("total_marks") or 0.0),
                    payload.get("grade"),
                ),
            )
            conn.commit()
            return get_grade_by_id(cursor.lastrowid)
        finally:
            conn.close()

    inserted = _grades_collection().insert_one(payload)
    return get_grade_by_id(inserted.inserted_id)


def update_grade(grade_id, payload):
    if _is_mysql_backend():
        existing = get_grade_by_id(grade_id)
        if not existing:
            return None

        mapping = {
            "internal_marks": "internal_marks",
            "external_marks": "external_marks",
            "assignment_score": "assignment_score",
            "total_marks": "total_marks",
            "grade": "grade",
        }

        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()

            if "student_id" in payload:
                student = _resolve_student_pk(cursor, payload.get("student_id"))
                if not student:
                    return None
                payload["_student_pk"] = student[0]

            if "subject" in payload:
                payload["_course_id"] = _resolve_course_id(cursor, payload.get("subject"))

            set_clauses = []
            values = []

            if "_student_pk" in payload:
                set_clauses.append("student_id = %s")
                values.append(payload["_student_pk"])
            if "_course_id" in payload:
                set_clauses.append("course_id = %s")
                values.append(payload["_course_id"])

            for key, column in mapping.items():
                if key in payload:
                    set_clauses.append(f"{column} = %s")
                    values.append(payload[key])

            if not set_clauses:
                return existing

            values.append(int(grade_id))
            cursor.execute(
                f"UPDATE grades SET {', '.join(set_clauses)} WHERE grade_id = %s",
                tuple(values),
            )
            conn.commit()
            return get_grade_by_id(grade_id)
        finally:
            conn.close()

    try:
        _grades_collection().update_one({"_id": ObjectId(grade_id)}, {"$set": payload})
        return get_grade_by_id(grade_id)
    except Exception:
        return None