import bcrypt
from flask import Blueprint, jsonify, request
from pymongo.errors import DuplicateKeyError

from database.db import get_db
from database.mysql_db import get_mysql_connection
from models.student_model import (
    create_student,
    delete_student,
    get_all_students,
    get_student_by_identifier,
    get_students_by_counsellor,
    update_student,
)
from models.user_model import create_user, find_user_by_email

student_bp = Blueprint("students", __name__, url_prefix="/api/students")

DEFAULT_STUDENT_PASSWORD = "student123"


def _default_student_password_hash():
    return bcrypt.hashpw(DEFAULT_STUDENT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _sync_student_login_account(name, email, plain_password=None):
    normalized_email = str(email or "").strip().lower()
    normalized_name = str(name or "").strip() or "Student"
    if not normalized_email:
        return "Student email is required to create login credentials"

    existing_user = find_user_by_email(normalized_email)
    
    if plain_password:
        password_hash = bcrypt.hashpw(str(plain_password).encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    else:
        password_hash = _default_student_password_hash()

    if existing_user:
        if str(existing_user.get("role", "")).lower() != "student":
            return "This email is already used by a non-student account"

        if existing_user.get("_id") is not None:
            get_db()["users"].update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"name": normalized_name, "password": password_hash, "role": "student"}},
            )
            return None

        user_id = existing_user.get("user_id")
        if user_id is not None:
            conn = get_mysql_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE users SET name = %s, password = %s, role = %s WHERE user_id = %s",
                    (normalized_name, password_hash, "student", user_id),
                )
                conn.commit()
                return None
            finally:
                conn.close()

        return "Failed to resolve existing student user account"

    create_user(name=normalized_name, email=normalized_email, password_hash=password_hash, role="student")
    return None


def _assert_student_login_email_available(email):
    normalized_email = str(email or "").strip().lower()
    existing_user = find_user_by_email(normalized_email)
    if not existing_user:
        return None
    if str(existing_user.get("role", "")).lower() != "student":
        return "This email is already used by a non-student account"
    return None


def _delete_student_login_account(email):
    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        return

    existing_user = find_user_by_email(normalized_email)
    if not existing_user:
        return

    if str(existing_user.get("role", "")).lower() != "student":
        return

    if existing_user.get("_id") is not None:
        get_db()["users"].delete_one({"_id": existing_user["_id"]})
        return

    user_id = existing_user.get("user_id")
    if user_id is not None:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
            conn.commit()
        finally:
            conn.close()


def _to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _build_student_payload(data):
    required_fields = [
        "student_id",
        "name",
        "branch",
        "semester",
        "batch",
        "counsellor_name",
    ]
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        return None, f"Missing required fields: {', '.join(missing)}"

    normalized_student_id = str(data.get("student_id", "")).strip()
    normalized_semester = _to_int(data.get("semester"), None)
    if normalized_semester is None:
        return None, "semester must be a valid integer"

    payload = {
        "student_id": normalized_student_id,
        "name": str(data.get("name", "")).strip(),
        "branch": str(data.get("branch", "")).strip(),
        "semester": normalized_semester,
        "batch": str(data.get("batch", "")).strip(),
        "counsellor_name": str(data.get("counsellor_name", "")).strip(),
        # Keep unique indexed fields stable even when admin submits a minimal payload.
        "enrollment_id": str(data.get("enrollment_id") or f"AUTO-{normalized_student_id}").strip(),
        "year": str(data.get("year", "")).strip(),
        "email": str(data.get("email") or f"{normalized_student_id}@edutrack.local").strip().lower(),
        "cgpa": _to_float(data.get("cgpa"), 0.0),
        "attendance_percentage": _to_float(data.get("attendance_percentage"), 0.0),
    }
    return payload, None


# Return all student documents for the frontend dashboard.
@student_bp.route("", methods=["GET"])
def get_students():
    try:
        return jsonify(get_all_students())
    except Exception as error:
        return jsonify({"error": f"Failed to fetch students: {str(error)}"}), 500


# Return one student document by email.
@student_bp.route("/email/<string:email>", methods=["GET"])
def get_student_by_email(email):
    try:
        db = get_db()
        student_doc = db['students'].find_one({"email": email.strip().lower()})
        if not student_doc:
            return jsonify({"error": "Student not found"}), 404
        student = {
            "id": str(student_doc.get("_id", "")),
            "student_id": student_doc.get("student_id"),
            "name": student_doc.get("name"),
            "batch": student_doc.get("batch"),
            "counsellor_name": student_doc.get("counsellor_name"),
            "enrollment_id": student_doc.get("enrollment_id"),
            "branch": student_doc.get("branch"),
            "year": student_doc.get("year"),
            "semester": student_doc.get("semester"),
            "email": student_doc.get("email"),
            "cgpa": float(student_doc.get("cgpa", 0.0)),
            "attendance_percentage": float(student_doc.get("attendance_percentage", 0.0)),
        }
        return jsonify(student)
    except Exception as error:
        return jsonify({"error": f"Failed to fetch student: {str(error)}"}), 500


# Return one student document by MongoDB ObjectId.
@student_bp.route("/<string:student_id>", methods=["GET"])
def get_student(student_id):
    try:
        student = get_student_by_identifier(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(student)
    except Exception as error:
        return jsonify({"error": f"Failed to fetch student: {str(error)}"}), 500


# Return all students assigned to a counsellor.
@student_bp.route("/counsellor/<string:counsellor_name>", methods=["GET"])
def get_students_by_counsellor_route(counsellor_name):
    try:
        normalized_name = str(counsellor_name).strip()
        if not normalized_name:
            return jsonify({"error": "counsellor_name is required"}), 400
        return jsonify(get_students_by_counsellor(normalized_name))
    except Exception as error:
        return jsonify({"error": f"Failed to fetch students by counsellor: {str(error)}"}), 500


# Create a new student profile document.
@student_bp.route("", methods=["POST"])
def create_student_route():
    try:
        data = request.get_json(silent=True) or {}
        payload, validation_error = _build_student_payload(data)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        login_conflict = _assert_student_login_email_available(payload.get("email"))
        if login_conflict:
            return jsonify({"error": login_conflict}), 409

        student = create_student(payload)

        sync_error = _sync_student_login_account(name=payload.get("name"), email=payload.get("email"))
        if sync_error:
            delete_student(student.get("id") or student.get("student_id"))
            return jsonify({"error": f"Failed to create linked login account: {sync_error}"}), 500

        return jsonify({"message": "Student created successfully", "student": student}), 201
    except DuplicateKeyError:
        return jsonify({"error": "student_id, enrollment_id or email already exists"}), 409
    except Exception as error:
        if "Duplicate entry" in str(error):
            return jsonify({"error": "student_id, enrollment_id or email already exists"}), 409
        return jsonify({"error": f"Failed to create student: {str(error)}"}), 500


@student_bp.route("/bulk", methods=["POST"])
def create_students_bulk_route():
    try:
        data = request.get_json(silent=True) or {}
        students = data.get("students")
        if not isinstance(students, list) or len(students) == 0:
            return jsonify({"error": "students must be a non-empty array"}), 400

        created_students = []
        errors = []

        for index, row in enumerate(students, start=1):
            payload, validation_error = _build_student_payload(row or {})
            if validation_error:
                errors.append({"row": index, "error": validation_error})
                continue

            login_conflict = _assert_student_login_email_available(payload.get("email"))
            if login_conflict:
                errors.append({"row": index, "student_id": payload.get("student_id"), "error": login_conflict})
                continue

            try:
                created = create_student(payload)
                sync_error = _sync_student_login_account(name=payload.get("name"), email=payload.get("email"))
                if sync_error:
                    delete_student(created.get("id") or created.get("student_id"))
                    errors.append({"row": index, "student_id": payload.get("student_id"), "error": f"login sync failed: {sync_error}"})
                else:
                    created_students.append(created)
            except DuplicateKeyError:
                errors.append({"row": index, "student_id": payload.get("student_id"), "error": "duplicate student_id, enrollment_id or email"})
            except Exception as error:
                if "Duplicate entry" in str(error):
                    errors.append({"row": index, "student_id": payload.get("student_id"), "error": "duplicate student_id, enrollment_id or email"})
                else:
                    errors.append({"row": index, "student_id": payload.get("student_id"), "error": str(error)})

        status_code = 201 if len(errors) == 0 else (200 if len(created_students) > 0 else 400)
        return (
            jsonify(
                {
                    "message": "Bulk student import processed",
                    "created_count": len(created_students),
                    "failed_count": len(errors),
                    "created_students": created_students,
                    "errors": errors,
                }
            ),
            status_code,
        )
    except Exception as error:
        return jsonify({"error": f"Failed to import students: {str(error)}"}), 500


# Update an existing student profile using its MongoDB ObjectId.
@student_bp.route("/<string:student_id>", methods=["PUT"])
def update_student_route(student_id):
    try:
        existing_student = get_student_by_identifier(student_id)
        if not existing_student:
            return jsonify({"error": "Student not found"}), 404

        data = request.get_json(silent=True) or {}
        payload = {}
        for field in ["student_id", "name", "enrollment_id", "branch", "year", "batch", "counsellor_name", "email"]:
            if field in data and data[field] is not None:
                value = str(data[field]).strip()
                if field == "counsellor_name" and not value:
                    return jsonify({"error": "counsellor_name cannot be empty"}), 400
                payload[field] = value.lower() if field == "email" else value

        if "semester" in data:
            normalized_semester = _to_int(data.get("semester"), None)
            if normalized_semester is None:
                return jsonify({"error": "semester must be a valid integer"}), 400
            payload["semester"] = normalized_semester

        if "cgpa" in data:
            payload["cgpa"] = _to_float(data.get("cgpa"), existing_student.get("cgpa", 0.0))
        if "attendance_percentage" in data:
            payload["attendance_percentage"] = _to_float(
                data.get("attendance_percentage"), existing_student.get("attendance_percentage", 0.0)
            )

        previous_email = str(existing_student.get("email") or "").strip().lower()
        student = update_student(student_id, payload)

        updated_name = payload.get("name") or existing_student.get("name")
        updated_email = str(payload.get("email") or existing_student.get("email") or "").strip().lower()
        sync_error = _sync_student_login_account(name=updated_name, email=updated_email)
        if sync_error:
            return jsonify({"error": f"Student updated but login sync failed: {sync_error}"}), 500

        if previous_email and previous_email != updated_email:
            _delete_student_login_account(previous_email)

        return jsonify({"message": "Student updated successfully", "student": student})
    except DuplicateKeyError:
        return jsonify({"error": "student_id, enrollment_id or email already exists"}), 409
    except Exception as error:
        if "Duplicate entry" in str(error):
            return jsonify({"error": "student_id, enrollment_id or email already exists"}), 409
        return jsonify({"error": f"Failed to update student: {str(error)}"}), 500


# Update counsellor assignment for a specific student.
@student_bp.route("/<string:student_id>/counsellor", methods=["PUT"])
def update_student_counsellor_route(student_id):
    try:
        data = request.get_json(silent=True) or {}
        counsellor_name = str(data.get("counsellor_name", "")).strip()
        if not counsellor_name:
            return jsonify({"error": "counsellor_name is required"}), 400

        student = update_student(student_id, {"counsellor_name": counsellor_name})
        if not student:
            return jsonify({"error": "Student not found"}), 404

        return jsonify({"message": "Counsellor updated successfully", "student": student})
    except Exception as error:
        return jsonify({"error": f"Failed to update counsellor: {str(error)}"}), 500

@student_bp.route("/batch-counsellor", methods=["PUT"])
def batch_update_counsellor_route():
    try:
        data = request.get_json(silent=True) or {}
        counsellor_name = str(data.get("counsellor_name", "")).strip()
        branch = str(data.get("branch", "")).strip()
        semester = _to_int(data.get("semester"), None)
        batch = str(data.get("batch", "")).strip()
        password_template = str(data.get("password_template", "")).strip()

        if not counsellor_name or not branch or not semester or not batch:
            return jsonify({"error": "counsellor_name, branch, semester, and batch are required"}), 400

        db = get_db()
        
        # Enforce faculty-semester uniqueness rule
        existing_assignment = db['students'].find_one({"counsellor_name": counsellor_name, "semester": {"$ne": semester}})
        if existing_assignment:
            return jsonify({"error": f"Faculty '{counsellor_name}' is already allocated to Semester {existing_assignment.get('semester')}. A faculty can only be allocated to batches within the same semester."}), 400
            
        query = {"branch": branch, "semester": semester, "batch": batch}
        
        students_to_update = list(db['students'].find(query))
        if not students_to_update:
            return jsonify({"message": "No students found matching the batch criteria."}), 404
            
        updated_count = 0
        for doc in students_to_update:
            student_id = str(doc.get("_id"))
            update_payload = {"counsellor_name": counsellor_name}
            update_student(student_id, update_payload)
            
            if password_template:
                # Resolve template for individual student
                enrollment = str(doc.get("enrollment_id") or doc.get("student_id") or "")
                new_pwd = password_template.replace("{enrollment}", enrollment)
                _sync_student_login_account(doc.get("name"), doc.get("email"), new_pwd)
                
            updated_count += 1

        return jsonify({"message": f"Successfully allocated {updated_count} students to {counsellor_name}."})
    except Exception as error:
        return jsonify({"error": f"Failed to perform batch allocation: {str(error)}"}), 500


# Delete a student profile using its MongoDB ObjectId.
@student_bp.route("/<string:student_id>", methods=["DELETE"])
def delete_student_route(student_id):
    try:
        existing_student = get_student_by_identifier(student_id)
        if not existing_student:
            return jsonify({"error": "Student not found"}), 404

        student_email = str(existing_student.get("email") or "").strip().lower()
        if not delete_student(student_id):
            return jsonify({"error": "Student not found"}), 404

        _delete_student_login_account(student_email)
        return jsonify({"message": "Student deleted successfully"})
    except Exception as error:
        return jsonify({"error": f"Failed to delete student: {str(error)}"}), 500
