from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model   = joblib.load('models/risk_model.pkl')
scaler  = joblib.load('models/scaler.pkl')
encoder = joblib.load('models/label_encoder.pkl')


def calculate_average_percent(scores, max_marks):
    percentages = [(s / m) * 100 for s, m in zip(scores, max_marks)]
    return round(sum(percentages) / len(percentages), 2)


def calculate_attendance_percent(attended, total):
    return round((attended / total) * 100, 2)


def get_risk_reason(features):
    thresholds = {
        'quiz_avg':       ('Quiz average is low',       55),
        'assignment_avg': ('Assignment average is low',  55),
        'exam_avg':       ('Exam average is low',        55),
        'attendance_pct': ('Attendance is below 75%',    75),
    }
    failing = []
    for key, (label, threshold) in thresholds.items():
        if features[key] < threshold:
            failing.append((label, threshold - features[key]))
    if not failing:
        return 'All areas are performing well'
    failing.sort(key=lambda x: x[1], reverse=True)
    return failing[0][0]


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    required = ['quiz_scores', 'quiz_max',
                'assignment_scores', 'assignment_max',
                'exam_scores', 'exam_max',
                'classes_attended', 'total_classes']

    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    computed = {
        'quiz_avg':       calculate_average_percent(
                              data['quiz_scores'], data['quiz_max']),
        'assignment_avg': calculate_average_percent(
                              data['assignment_scores'], data['assignment_max']),
        'exam_avg':       calculate_average_percent(
                              data['exam_scores'], data['exam_max']),
        'attendance_pct': calculate_attendance_percent(
                              data['classes_attended'], data['total_classes'])
    }

    features = np.array([[
        computed['quiz_avg'],
        computed['assignment_avg'],
        computed['exam_avg'],
        computed['attendance_pct']
    ]])

    scaled     = scaler.transform(features)
    pred       = model.predict(scaled)[0]
    proba      = model.predict_proba(scaled)[0]
    risk_label = encoder.inverse_transform([pred])[0]
    confidence = round(float(max(proba)) * 100, 1)
    reason     = get_risk_reason(computed)

    return jsonify({
        'risk_level': risk_label,
        'confidence': f'{confidence}%',
        'reason':     reason,
        'computed':   computed
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
