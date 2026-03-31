from flask import Blueprint, jsonify, request

from models.marks_model import create_marks, get_marks_by_student_id
from models.student_model import get_student_by_identifier

marks_bp = Blueprint("marks", __name__, url_prefix="/api/marks")

_VALID_TYPES = {"quiz", "exam", "assignment", "practical"}


def _to_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


# Add marks records for one or more students.
@marks_bp.route("", methods=["POST"])
def create_marks_route():
    try:
        payload = request.get_json(silent=True)
        if isinstance(payload, dict) and isinstance(payload.get("marks"), list):
            entries = payload.get("marks", [])
        elif isinstance(payload, list):
            entries = payload
        elif isinstance(payload, dict):
            entries = [payload]
        else:
            entries = []

        if not entries:
            return jsonify({"error": "Provide marks data"}), 400

        records = []
        errors = []

        for index, item in enumerate(entries, start=1):
            student_ref = str(item.get("student_id", "")).strip()
            subject = str(item.get("subject", "")).strip()
            mark_type = str(item.get("type", "")).strip().lower()
            marks = _to_float(item.get("marks"), None)

            if not student_ref or not subject or mark_type not in _VALID_TYPES or marks is None:
                errors.append(
                    f"Entry {index} requires student_id, subject, type (quiz/exam/assignment/practical), marks"
                )
                continue

            student = get_student_by_identifier(student_ref)
            if not student:
                errors.append(f"Entry {index}: student not found ({student_ref})")
                continue

            records.append(
                {
                    "student_id": student["student_id"],
                    "subject": subject,
                    "type": mark_type,
                    "marks": marks,
                }
            )

        if errors:
            return jsonify({"error": "Invalid marks data", "details": errors}), 400

        saved = create_marks(records)
        return jsonify({"message": "Marks saved successfully", "marks": saved}), 201
    except Exception as error:
        return jsonify({"error": f"Failed to save marks: {str(error)}"}), 500


# Get all marks records for a student.
@marks_bp.route("/<string:student_id>", methods=["GET"])
def get_marks(student_id):
    try:
        student = get_student_by_identifier(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(get_marks_by_student_id(student["student_id"]))
    except Exception as error:
        return jsonify({"error": f"Failed to fetch marks: {str(error)}"}), 500
