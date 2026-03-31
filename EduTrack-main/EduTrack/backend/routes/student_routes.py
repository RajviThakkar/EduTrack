from flask import Blueprint, jsonify, request
from pymongo.errors import DuplicateKeyError

from models.student_model import (
    create_student,
    delete_student,
    get_all_students,
    get_student_by_identifier,
    get_students_by_counsellor,
    update_student,
)

student_bp = Blueprint("students", __name__, url_prefix="/api/students")


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


# Return all student documents for the frontend dashboard.
@student_bp.route("", methods=["GET"])
def get_students():
    try:
        return jsonify(get_all_students())
    except Exception as error:
        return jsonify({"error": f"Failed to fetch students: {str(error)}"}), 500


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
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        normalized_student_id = str(data.get("student_id", "")).strip()
        normalized_semester = _to_int(data.get("semester"), None)
        if normalized_semester is None:
            return jsonify({"error": "semester must be a valid integer"}), 400

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

        student = create_student(payload)
        return jsonify({"message": "Student created successfully", "student": student}), 201
    except DuplicateKeyError:
        return jsonify({"error": "student_id, enrollment_id or email already exists"}), 409
    except Exception as error:
        if "Duplicate entry" in str(error):
            return jsonify({"error": "student_id, enrollment_id or email already exists"}), 409
        return jsonify({"error": f"Failed to create student: {str(error)}"}), 500


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

        student = update_student(student_id, payload)
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


# Delete a student profile using its MongoDB ObjectId.
@student_bp.route("/<string:student_id>", methods=["DELETE"])
def delete_student_route(student_id):
    try:
        if not delete_student(student_id):
            return jsonify({"error": "Student not found"}), 404
        return jsonify({"message": "Student deleted successfully"})
    except Exception as error:
        return jsonify({"error": f"Failed to delete student: {str(error)}"}), 500
