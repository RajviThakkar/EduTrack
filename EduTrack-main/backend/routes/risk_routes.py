from flask import Blueprint, jsonify

from models.risk_model import get_risk_predictions

risk_bp = Blueprint("risk", __name__, url_prefix="/api/risk")


# Return rule-based risk prediction for all students.
@risk_bp.route("", methods=["GET"])
def get_risk():
    try:
        predictions = get_risk_predictions()
        # Keep response aligned with frontend requirement.
        return jsonify(
            [
                {
                    "student_id": item.get("student_id"),
                    "name": item.get("name"),
                    "status": item.get("status"),
                    "reason": item.get("reason"),
                }
                for item in predictions
            ]
        )
    except Exception as error:
        return jsonify({"error": f"Failed to generate risk predictions: {str(error)}"}), 500
