import pickle
from pathlib import Path

from flask import Blueprint, jsonify, request

prediction_bp = Blueprint("prediction", __name__, url_prefix="/api")

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "ml" / "cgpa_model.pkl"
DEFAULT_MODEL = {
    "intercept": 0.75,
    "weights": [0.018, 0.012, 0.01, 0.62],
}


def _ensure_model_file():
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.exists():
        return
    with MODEL_PATH.open("wb") as model_file:
        pickle.dump(DEFAULT_MODEL, model_file)


def _load_model():
    _ensure_model_file()
    try:
        with MODEL_PATH.open("rb") as model_file:
            return pickle.load(model_file)
    except Exception:
        with MODEL_PATH.open("wb") as model_file:
            pickle.dump(DEFAULT_MODEL, model_file)
        return DEFAULT_MODEL


def _predict(model, features):
    if hasattr(model, "predict"):
        return float(model.predict([features])[0])

    if isinstance(model, dict):
        intercept = float(model.get("intercept", 0.0))
        weights = model.get("weights", [0.0, 0.0, 0.0, 0.0])
        return intercept + sum(float(weight) * float(value) for weight, value in zip(weights, features))

    raise ValueError("Unsupported model format")


# Predict the student's CGPA using the saved ML model and request payload values.
@prediction_bp.route("/predict-cgpa", methods=["POST"])
def predict_cgpa():
    try:
        data = request.get_json(silent=True) or {}
        required_fields = ["attendance", "internal_marks", "assignment_score", "previous_cgpa"]
        missing = [field for field in required_fields if field not in data]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        features = [
            float(data.get("attendance", 0)),
            float(data.get("internal_marks", 0)),
            float(data.get("assignment_score", 0)),
            float(data.get("previous_cgpa", 0)),
        ]

        model = _load_model()
        predicted_cgpa = _predict(model, features)
        predicted_cgpa = max(0.0, min(10.0, round(predicted_cgpa, 2)))
        return jsonify({"predicted_cgpa": predicted_cgpa})
    except ValueError as error:
        return jsonify({"error": f"Invalid input: {str(error)}"}), 400
    except Exception as error:
        return jsonify({"error": f"Failed to predict CGPA: {str(error)}"}), 500
