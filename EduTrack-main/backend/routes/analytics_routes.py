from flask import Blueprint, jsonify

from models.risk_model import get_dashboard_risk_counts

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


# Return dashboard counters for total students and risk split.
@analytics_bp.route("/dashboard", methods=["GET"])
def dashboard_analytics():
    try:
        return jsonify(get_dashboard_risk_counts())
    except Exception as error:
        return jsonify({"error": f"Failed to fetch dashboard analytics: {str(error)}"}), 500
