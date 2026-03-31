from flask import current_app

from database.db import get_db
from database.mysql_db import get_mysql_connection


def _is_mysql_backend():
    return current_app.config.get("DB_BACKEND", "mongo").lower() in {"mysql", "both"}


def _marks_collection():
    return get_db()["marks"]


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


def ensure_marks_indexes():
    """Create indexes for Mongo backend only."""
    if _is_mysql_backend():
        return

    collection = _marks_collection()
    collection.create_index("student_id")
    collection.create_index("subject")
    collection.create_index("type")


def _serialize_mark(document):
    if not document:
        return None

    if _is_mysql_backend():
        return {
            "id": str(document.get("marks_id")),
            "student_id": document.get("student_code") or str(document.get("student_id")),
            "subject": document.get("course_name"),
            "type": document.get("assessment_type"),
            "marks": float(document.get("marks") or 0.0),
        }

    return {
        "id": str(document["_id"]),
        "student_id": document.get("student_id"),
        "subject": document.get("subject"),
        "type": document.get("type"),
        "marks": float(document.get("marks", 0.0)),
    }


def create_marks(records):
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
                    INSERT INTO marks (student_id, course_id, assessment_type, marks)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE marks = VALUES(marks)
                    """,
                    (
                        student[0],
                        course_id,
                        str(item.get("type") or "exam").strip().lower(),
                        float(item.get("marks") or 0.0),
                    ),
                )
            conn.commit()
            return get_marks_by_student_id(records[0].get("student_id")) if records else []
        finally:
            conn.close()

    inserted = _marks_collection().insert_many(records)
    cursor = _marks_collection().find({"_id": {"$in": inserted.inserted_ids}})
    return [_serialize_mark(item) for item in cursor]


def get_marks_by_student_id(student_id):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT m.marks_id, m.student_id, s.student_code, c.course_name, m.assessment_type, m.marks
                FROM marks m
                JOIN students s ON s.student_id = m.student_id
                JOIN courses c ON c.course_id = m.course_id
                WHERE s.student_code = %s OR CAST(s.student_id AS CHAR) = %s
                ORDER BY c.course_name ASC
                """,
                (str(student_id), str(student_id)),
            )
            return [_serialize_mark(item) for item in cursor.fetchall()]
        finally:
            conn.close()

    cursor = _marks_collection().find({"student_id": str(student_id)}).sort("subject", 1)
    return [_serialize_mark(item) for item in cursor]