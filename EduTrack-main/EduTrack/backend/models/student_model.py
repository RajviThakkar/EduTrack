from bson import ObjectId
from bson.errors import InvalidId
from flask import current_app

from database.db import get_db
from database.mysql_db import get_mysql_connection


def _is_mysql_backend():
    return current_app.config.get("DB_BACKEND", "mongo").lower() in {"mysql", "both"}


def _students_collection():
    return get_db()["students"]


def ensure_student_indexes():
    """Create indexes for Mongo backend; MySQL indexes are in schema."""
    if _is_mysql_backend():
        return

    collection = _students_collection()
    collection.create_index("student_id", unique=True)
    collection.create_index("enrollment_id", unique=True)
    collection.create_index("email", unique=True)
    collection.create_index("counsellor_name")


def _serialize_student(document):
    if not document:
        return None

    if _is_mysql_backend():
        return {
            "id": str(document.get("student_id")),
            "student_id": document.get("student_code") or str(document.get("student_id")),
            "name": document.get("name"),
            "batch": document.get("batch"),
            "counsellor_name": document.get("counsellor_name"),
            "enrollment_id": document.get("enrollment_no"),
            "branch": document.get("department"),
            "year": document.get("year"),
            "semester": document.get("semester"),
            "email": document.get("email"),
            "cgpa": float(document.get("cgpa") or 0.0),
            "attendance_percentage": float(document.get("attendance_percentage") or 0.0),
        }

    return {
        "id": str(document["_id"]),
        "student_id": document.get("student_id"),
        "name": document.get("name"),
        "batch": document.get("batch"),
        "counsellor_name": document.get("counsellor_name"),
        "enrollment_id": document.get("enrollment_id"),
        "branch": document.get("branch"),
        "year": document.get("year"),
        "semester": document.get("semester"),
        "email": document.get("email"),
        "cgpa": float(document.get("cgpa", 0.0)),
        "attendance_percentage": float(document.get("attendance_percentage", 0.0)),
    }


def _mysql_find_student_row(identifier):
    identifier_str = str(identifier or "").strip()
    if not identifier_str:
        return None

    conn = get_mysql_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT student_id, user_id, student_code, name, enrollment_no, department, semester,
                   batch, year, counsellor_name, email, cgpa, attendance_percentage, created_at
            FROM students
            WHERE student_code = %s OR enrollment_no = %s OR CAST(student_id AS CHAR) = %s
            LIMIT 1
            """,
            (identifier_str, identifier_str, identifier_str),
        )
        return cursor.fetchone()
    finally:
        conn.close()


def get_all_students():
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT student_id, user_id, student_code, name, enrollment_no, department, semester,
                       batch, year, counsellor_name, email, cgpa, attendance_percentage, created_at
                FROM students
                ORDER BY student_code ASC, student_id ASC
                """
            )
            return [_serialize_student(item) for item in cursor.fetchall()]
        finally:
            conn.close()

    cursor = _students_collection().find().sort("student_id", 1)
    return [_serialize_student(item) for item in cursor]


def get_student_by_id(student_object_id):
    if _is_mysql_backend():
        return _serialize_student(_mysql_find_student_row(student_object_id))

    try:
        document = _students_collection().find_one({"_id": ObjectId(student_object_id)})
        return _serialize_student(document)
    except Exception:
        return None


def _get_student_document_by_identifier(identifier):
    if _is_mysql_backend():
        return _mysql_find_student_row(identifier)

    if identifier is None:
        return None

    identifier_str = str(identifier).strip()
    if not identifier_str:
        return None

    queries = [{"student_id": identifier_str}]
    try:
        queries.insert(0, {"_id": ObjectId(identifier_str)})
    except (InvalidId, TypeError, ValueError):
        pass

    if len(queries) == 1:
        return _students_collection().find_one(queries[0])
    return _students_collection().find_one({"$or": queries})


def get_student_by_student_id(student_id):
    if _is_mysql_backend():
        return _serialize_student(_mysql_find_student_row(student_id))
    document = _students_collection().find_one({"student_id": str(student_id)})
    return _serialize_student(document)


def get_student_by_identifier(identifier):
    return _serialize_student(_get_student_document_by_identifier(identifier))


def get_students_by_counsellor(counsellor_name):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT student_id, user_id, student_code, name, enrollment_no, department, semester,
                       batch, year, counsellor_name, email, cgpa, attendance_percentage, created_at
                FROM students
                WHERE counsellor_name = %s
                ORDER BY student_code ASC, student_id ASC
                """,
                (counsellor_name,),
            )
            return [_serialize_student(item) for item in cursor.fetchall()]
        finally:
            conn.close()

    cursor = _students_collection().find({"counsellor_name": counsellor_name}).sort("student_id", 1)
    return [_serialize_student(item) for item in cursor]


def create_student(payload):
    if _is_mysql_backend():
        student_code = str(payload.get("student_id") or "").strip()
        enrollment_no = str(payload.get("enrollment_id") or student_code).strip()
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO students (
                    user_id, student_code, name, enrollment_no, department, semester,
                    batch, year, counsellor_name, email, cgpa, attendance_percentage
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload.get("user_id"),
                    student_code,
                    payload.get("name"),
                    enrollment_no,
                    payload.get("branch"),
                    int(payload.get("semester") or 0),
                    payload.get("batch"),
                    payload.get("year"),
                    payload.get("counsellor_name"),
                    payload.get("email"),
                    float(payload.get("cgpa") or 0.0),
                    float(payload.get("attendance_percentage") or 0.0),
                ),
            )
            conn.commit()
            return get_student_by_id(cursor.lastrowid)
        finally:
            conn.close()

    inserted = _students_collection().insert_one(payload)
    return get_student_by_id(inserted.inserted_id)


def update_student(student_object_id, payload):
    if _is_mysql_backend():
        existing = _mysql_find_student_row(student_object_id)
        if not existing:
            return None

        mapping = {
            "student_id": "student_code",
            "name": "name",
            "enrollment_id": "enrollment_no",
            "branch": "department",
            "year": "year",
            "batch": "batch",
            "counsellor_name": "counsellor_name",
            "email": "email",
            "semester": "semester",
            "cgpa": "cgpa",
            "attendance_percentage": "attendance_percentage",
            "user_id": "user_id",
        }

        set_clauses = []
        values = []
        for key, value in payload.items():
            column = mapping.get(key)
            if not column:
                continue
            set_clauses.append(f"{column} = %s")
            values.append(value)

        if not set_clauses:
            return _serialize_student(existing)

        values.append(existing["student_id"])
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE students SET {', '.join(set_clauses)} WHERE student_id = %s",
                tuple(values),
            )
            conn.commit()
            return get_student_by_id(existing["student_id"])
        finally:
            conn.close()

    try:
        document = _get_student_document_by_identifier(student_object_id)
        if not document:
            return None
        _students_collection().update_one({"_id": document["_id"]}, {"$set": payload})
        return get_student_by_id(document["_id"])
    except Exception:
        return None


def delete_student(student_object_id):
    if _is_mysql_backend():
        existing = _mysql_find_student_row(student_object_id)
        if not existing:
            return False

        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM students WHERE student_id = %s", (existing["student_id"],))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    try:
        document = _get_student_document_by_identifier(student_object_id)
        if not document:
            return False
        result = _students_collection().delete_one({"_id": document["_id"]})
        return result.deleted_count > 0
    except Exception:
        return False