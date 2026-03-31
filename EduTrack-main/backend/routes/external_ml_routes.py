import requests
from flask import Blueprint, jsonify, request

ml_integration_bp = Blueprint("ml_integration", __name__, url_prefix="/api/ml")

# The external ML service URL (running separately from the cloned repo)
ML_SERVICE_URL = "http://127.0.0.1:5001"

@ml_integration_bp.route("/predict", methods=["POST"])
def get_ml_prediction():
    """
    Receives JSON from frontend, forwards to external ML project's API,
    and returns the prediction. 
    """
    try:
        data = request.get_json(silent=True) or {}
        
        # Forward data to the ML API
        response = requests.post(f"{ML_SERVICE_URL}/predict", json=data)
        
        if response.status_code == 200:
            prediction_data = response.json()
            # Optionally store it in MongoDB here if needed
            # For now, we return it to the frontend
            return jsonify({
                "success": True,
                "prediction": prediction_data
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "ML Service failed to process request",
                "details": response.text
            }), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": "Failed to connect to ML Service. Please make sure the external ML API is running.",
            "details": str(e)
        }), 500


@ml_integration_bp.route("/predict-score", methods=["POST"])
def get_ml_score_prediction():
    """
    Receives JSON from frontend, forwards to external ML project's forecast API
    """
    try:
        data = request.get_json(silent=True) or {}
        
        response = requests.post(f"{ML_SERVICE_URL}/predict-score", json=data)
        
        if response.status_code == 200:
            prediction_data = response.json()
            return jsonify({
                "success": True,
                "prediction": prediction_data
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "ML Service failed to process request",
                "details": response.text
            }), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": "Failed to connect to ML Service.",
            "details": str(e)
        }), 500
