from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model   = joblib.load('models/risk_model.pkl')
scaler  = joblib.load('models/scaler.pkl')
encoder = joblib.load('models/label_encoder.pkl')

forecast_model  = joblib.load('models/forecast_model.pkl')
forecast_scaler = joblib.load('models/forecast_scaler.pkl')

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

def get_suggestions_api(data):
    suggestions = []
    if data['quiz_avg'] < 55:
        suggestions.append('Practice more quizzes — aim for weekly revision')
    if data['assignment_avg'] < 55:
        suggestions.append('Complete all assignments on time')
    if data['exam_avg'] < 55:
        suggestions.append('Focus on exam preparation — solve previous year papers')
    if data['attendance_pct'] < 75:
        suggestions.append('Improve attendance — aim for at least 75%')
    if data['prev_gpa'] < 50:
        suggestions.append('Revise core concepts from previous semester')
    if data['study_hours'] < 1.5:
        suggestions.append('Increase daily study hours — aim for 2-3 hours per day')
    return suggestions if suggestions else ['Keep up the great work!']

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

@app.route('/predict-score', methods=['POST'])
def predict_score_route():
    data = request.get_json()

    required = ['quiz_avg', 'assignment_avg', 'exam_avg',
                'attendance_pct', 'prev_gpa', 'study_hours']

    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    features = np.array([[
        data['quiz_avg'], data['assignment_avg'], data['exam_avg'],
        data['attendance_pct'], data['prev_gpa'], data['study_hours']
    ]])

    scaled          = forecast_scaler.transform(features)
    predicted_score = round(float(forecast_model.predict(scaled)[0]), 1)
    predicted_score = max(0, min(100, predicted_score))

    if predicted_score >= 70:   grade = 'Distinction'
    elif predicted_score >= 60: grade = 'First Class'
    elif predicted_score >= 50: grade = 'Second Class'
    elif predicted_score >= 40: grade = 'Pass'
    else:                       grade = 'At Risk of Failing'

    if predicted_score < 50:
        improvement = f'Need +{round(50 - predicted_score, 1)} marks to pass'
    elif predicted_score < 70:
        improvement = f'Need +{round(70 - predicted_score, 1)} marks for distinction'
    else:
        improvement = 'On track for distinction'

    return jsonify({
        'predicted_score': predicted_score,
        'grade':           grade,
        'improvement':     improvement,
        'suggestions':     get_suggestions_api(data)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)







