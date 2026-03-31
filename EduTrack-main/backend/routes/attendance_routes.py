from flask import Blueprint, jsonify, request

from models.attendance_model import create_attendance_entries, get_attendance_entries_by_student
from models.student_model import get_student_by_identifier

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


def _normalize_status(value):
    normalized = str(value or "").strip().lower()
    if normalized == "present":
        return "Present"
    if normalized == "absent":
        return "Absent"
    return None


# Save attendance records for multiple students.
@attendance_bp.route("", methods=["POST"])
def create_attendance_route():
    try:
        payload = request.get_json(silent=True)
        if isinstance(payload, dict):
            entries = payload.get("attendance", [])
        elif isinstance(payload, list):
            entries = payload
        else:
            entries = []

        if not isinstance(entries, list) or not entries:
            return jsonify({"error": "Provide attendance as a non-empty list"}), 400

        records = []
        errors = []

        for index, item in enumerate(entries, start=1):
            if not isinstance(item, dict):
                errors.append(f"Entry {index} must be an object")
                continue

            student_ref = str(item.get("student_id", "")).strip()
            subject = str(item.get("subject", "")).strip()
            date = str(item.get("date", "")).strip()
            status = _normalize_status(item.get("status"))

            if not all([student_ref, subject, date, status]):
                errors.append(
                    f"Entry {index} requires student_id, subject, date and status (Present/Absent)"
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
                    "date": date,
                    "status": status,
                }
            )

        if errors:
            return jsonify({"error": "Invalid attendance data", "details": errors}), 400

        saved = create_attendance_entries(records)
        return jsonify({"message": "Attendance saved successfully", "attendance": saved}), 201
    except Exception as error:
        return jsonify({"error": f"Failed to save attendance: {str(error)}"}), 500


# Get all attendance records for a student.
@attendance_bp.route("/<string:student_id>", methods=["GET"])
def get_attendance(student_id):
    try:
        student = get_student_by_identifier(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(get_attendance_entries_by_student(student["student_id"]))
    except Exception as error:
        return jsonify({"error": f"Failed to fetch attendance: {str(error)}"}), 500
