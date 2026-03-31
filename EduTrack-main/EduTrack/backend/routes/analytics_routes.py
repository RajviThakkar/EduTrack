from flask import Blueprint, jsonify

from database.db import get_db

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


def _students_collection():
    return get_db()["students"]


def _grades_collection():
    return get_db()["grades"]


# Return dashboard analytics for total students, CGPA, attendance and at-risk count.
@analytics_bp.route("/dashboard", methods=["GET"])
def dashboard_analytics():
    try:
        total_students = _students_collection().count_documents({})

        cgpa_aggregate = _students_collection().aggregate(
            [{"$group": {"_id": None, "average_cgpa": {"$avg": "$cgpa"}}}]
        )
        attendance_aggregate = _students_collection().aggregate(
            [{"$group": {"_id": None, "average_attendance": {"$avg": "$attendance_percentage"}}}]
        )

        average_cgpa = round(float((next(cgpa_aggregate, {}) or {}).get("average_cgpa", 0.0) or 0.0), 2)
        average_attendance = round(
            float((next(attendance_aggregate, {}) or {}).get("average_attendance", 0.0) or 0.0), 2
        )

        number_of_at_risk_students = _students_collection().count_documents(
            {
                "$or": [
                    {"cgpa": {"$lt": 6.0}},
                    {"attendance_percentage": {"$lt": 75.0}},
                ]
            }
        )

        return jsonify(
            {
                "total_students": total_students,
                "average_cgpa": average_cgpa,
                "average_attendance": average_attendance,
                "number_of_at_risk_students": number_of_at_risk_students,
            }
        )
    except Exception as error:
        return jsonify({"error": f"Failed to fetch dashboard analytics: {str(error)}"}), 500


# Return subjects sorted by lowest average marks to highlight risk areas.
@analytics_bp.route("/subject-risk", methods=["GET"])
def subject_risk_analytics():
    try:
        subject_data = _grades_collection().aggregate(
            [
                {
                    "$group": {
                        "_id": "$subject",
                        "average_marks": {"$avg": "$total_marks"},
                        "records": {"$sum": 1},
                    }
                },
                {"$sort": {"average_marks": 1, "_id": 1}},
            ]
        )

        result = [
            {
                "subject": row.get("_id"),
                "average_marks": round(float(row.get("average_marks", 0.0)), 2),
                "records": int(row.get("records", 0)),
            }
            for row in subject_data
        ]
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": f"Failed to fetch subject risk analytics: {str(error)}"}), 500
