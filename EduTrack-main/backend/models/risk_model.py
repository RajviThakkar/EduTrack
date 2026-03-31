from flask import current_app

from database.db import get_db
from database.mysql_db import get_mysql_connection


def _is_mysql_backend():
    return current_app.config.get("DB_BACKEND", "mongo").lower() in {"mysql", "both"}


def _students_collection():
    return get_db()["students"]


def _attendance_collection():
    return get_db()["attendance"]


def _marks_collection():
    return get_db()["marks"]


def _attendance_percentage(student_id):
    total = _attendance_collection().count_documents({"student_id": student_id})
    if total == 0:
        return 100.0

    present = _attendance_collection().count_documents(
        {
            "student_id": student_id,
            "status": {"$regex": "^present$", "$options": "i"},
        }
    )
    return round((present / total) * 100, 2)


def _average_marks(student_id):
    aggregate = _marks_collection().aggregate(
        [
            {"$match": {"student_id": student_id}},
            {"$group": {"_id": None, "avg_marks": {"$avg": "$marks"}}},
        ]
    )
    return round(float((next(aggregate, {}) or {}).get("avg_marks", 100.0) or 100.0), 2)


def _mysql_attendance_percentage(cursor, student_pk):
    cursor.execute("SELECT COUNT(*) AS total FROM attendance WHERE student_id = %s", (student_pk,))
    total = int((cursor.fetchone() or {}).get("total") or 0)
    if total == 0:
        return 100.0

    cursor.execute(
        """
        SELECT COUNT(*) AS present
        FROM attendance
        WHERE student_id = %s AND LOWER(status) = 'present'
        """,
        (student_pk,),
    )
    present = int((cursor.fetchone() or {}).get("present") or 0)
    return round((present / total) * 100, 2)


def _mysql_average_marks(cursor, student_pk):
    cursor.execute("SELECT AVG(marks) AS avg_marks FROM marks WHERE student_id = %s", (student_pk,))
    avg = float((cursor.fetchone() or {}).get("avg_marks") or 100.0)
    return round(avg, 2)


def _evaluate_risk(attendance_percentage, average_marks):
    if attendance_percentage < 50 or average_marks < 40:
        return "High", "Critical attendance or marks"
    if attendance_percentage < 75 or average_marks < 60:
        return "Medium", "Moderate attendance or marks"
    return "Low", "Good attendance and marks"


def get_risk_predictions():
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT student_id, student_code, name FROM students ORDER BY student_code ASC, student_id ASC"
            )
            students = cursor.fetchall()

            predictions = []
            for student in students:
                student_pk = student.get("student_id")
                student_code = student.get("student_code") or str(student_pk)
                attendance_percentage = _mysql_attendance_percentage(cursor, student_pk)
                average_marks = _mysql_average_marks(cursor, student_pk)
                status, reason = _evaluate_risk(attendance_percentage, average_marks)

                predictions.append(
                    {
                        "student_id": student_code,
                        "name": student.get("name") or "Unknown",
                        "status": status,
                        "reason": reason,
                        "attendance_percentage": attendance_percentage,
                        "average_marks": average_marks,
                    }
                )

                cursor.execute(
                    """
                    INSERT INTO risk_prediction (student_id, attendance_percentage, marks, risk_level)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        attendance_percentage = VALUES(attendance_percentage),
                        marks = VALUES(marks),
                        risk_level = VALUES(risk_level)
                    """,
                    (student_pk, attendance_percentage, average_marks, status),
                )

            conn.commit()
            return predictions
        finally:
            conn.close()

    students = _students_collection().find({}, {"student_id": 1, "name": 1}).sort("student_id", 1)

    predictions = []
    for student in students:
        student_id = str(student.get("student_id", "")).strip()
        if not student_id:
            continue

        attendance_percentage = _attendance_percentage(student_id)
        average_marks = _average_marks(student_id)
        status, reason = _evaluate_risk(attendance_percentage, average_marks)

        predictions.append(
            {
                "student_id": student_id,
                "name": student.get("name", "Unknown"),
                "status": status,
                "reason": reason,
                "attendance_percentage": attendance_percentage,
                "average_marks": average_marks,
            }
        )

    return predictions


def get_dashboard_risk_counts():
    predictions = get_risk_predictions()
    low_risk = sum(1 for item in predictions if item.get("status") == "Low")
    medium_risk = sum(1 for item in predictions if item.get("status") == "Medium")
    high_risk = sum(1 for item in predictions if item.get("status") == "High")

    return {
        "total_students": len(predictions),
        "low_risk": low_risk,
        "medium_risk": medium_risk,
        "high_risk": high_risk,
    }