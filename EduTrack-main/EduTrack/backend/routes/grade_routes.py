from flask import Blueprint, jsonify, request
from pymongo.errors import DuplicateKeyError

from models.grade_model import calculate_grade, create_grade, get_grade_by_id, get_grades_by_student_id, update_grade
from models.student_model import get_student_by_identifier

grade_bp = Blueprint("grades", __name__, url_prefix="/api/grades")


def _to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


# Return all grade records for the given student_id.
@grade_bp.route("/<string:student_id>", methods=["GET"])
def get_grades(student_id):
    try:
        student = get_student_by_identifier(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(get_grades_by_student_id(student["student_id"]))
    except Exception as error:
        return jsonify({"error": f"Failed to fetch grades: {str(error)}"}), 500


# Create a grade record and calculate total marks and grade value.
@grade_bp.route("", methods=["POST"])
def create_grade_route():
    try:
        data = request.get_json(silent=True) or {}
        required_fields = ["student_id", "subject", "internal_marks", "external_marks"]
        missing = [field for field in required_fields if field not in data]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        student = get_student_by_identifier(str(data.get("student_id", "")).strip())
        if not student:
            return jsonify({"error": "Student not found"}), 404

        internal_marks = _to_float(data.get("internal_marks"), 0.0)
        external_marks = _to_float(data.get("external_marks"), 0.0)
        assignment_score = _to_float(data.get("assignment_score"), 0.0)
        total_marks = _to_float(
            data.get("total_marks"),
            internal_marks + external_marks + assignment_score,
        )
        grade_value = str(data.get("grade") or calculate_grade(total_marks)).strip()

        payload = {
            "student_id": student["student_id"],
            "subject": str(data.get("subject", "")).strip(),
            "internal_marks": internal_marks,
            "external_marks": external_marks,
            "assignment_score": assignment_score,
            "total_marks": total_marks,
            "grade": grade_value,
        }
        grade = create_grade(payload)
        return jsonify({"message": "Grade created successfully", "grade": grade}), 201
    except DuplicateKeyError:
        return jsonify({"error": "Grade already exists for this student and subject"}), 409
    except Exception as error:
        return jsonify({"error": f"Failed to create grade: {str(error)}"}), 500


# Update an existing grade record by its MongoDB ObjectId.
@grade_bp.route("/<string:grade_id>", methods=["PUT"])
def update_grade_route(grade_id):
    try:
        existing_record = get_grade_by_id(grade_id)
        if not existing_record:
            return jsonify({"error": "Grade record not found"}), 404

        data = request.get_json(silent=True) or {}
        payload = {}

        if "student_id" in data:
            student = get_student_by_identifier(str(data.get("student_id", "")).strip())
            if not student:
                return jsonify({"error": "Student not found"}), 404
            payload["student_id"] = student["student_id"]
        if "subject" in data:
            payload["subject"] = str(data.get("subject", "")).strip()
        if "internal_marks" in data:
            payload["internal_marks"] = _to_float(data.get("internal_marks"), 0.0)
        if "external_marks" in data:
            payload["external_marks"] = _to_float(data.get("external_marks"), 0.0)
        if "assignment_score" in data:
            payload["assignment_score"] = _to_float(data.get("assignment_score"), 0.0)

        if "total_marks" in data:
            payload["total_marks"] = _to_float(data.get("total_marks"), 0.0)
        else:
            payload["total_marks"] = (
                payload.get("internal_marks", existing_record.get("internal_marks", 0.0))
                + payload.get("external_marks", existing_record.get("external_marks", 0.0))
                + payload.get("assignment_score", existing_record.get("assignment_score", 0.0))
            )

        if "grade" in data:
            payload["grade"] = str(data.get("grade", "")).strip()
        else:
            payload["grade"] = calculate_grade(payload["total_marks"])

        grade = update_grade(grade_id, payload)
        return jsonify({"message": "Grade updated successfully", "grade": grade})
    except DuplicateKeyError:
        return jsonify({"error": "Grade already exists for this student and subject"}), 409
    except Exception as error:
        return jsonify({"error": f"Failed to update grade: {str(error)}"}), 500
