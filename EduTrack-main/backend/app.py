from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from database.db import init_db
from database.mysql_db import init_mysql
from models.attendance_model import ensure_attendance_indexes
from models.grade_model import ensure_grade_indexes
from models.marks_model import ensure_marks_indexes
from models.student_model import ensure_student_indexes
from models.user_model import ensure_user_indexes
from routes.analytics_routes import analytics_bp
from routes.attendance_routes import attendance_bp
from routes.auth_routes import auth_bp
from routes.event_routes import event_bp
from routes.grade_routes import grade_bp
from routes.marks_routes import marks_bp
from routes.prediction_routes import prediction_bp
from routes.resource_routes import resource_bp
from routes.risk_routes import risk_bp
from routes.student_routes import student_bp
from routes.system_routes import system_bp
from routes.external_ml_routes import ml_integration_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db_backend = app.config.get("DB_BACKEND", "mongo").lower()

    cors_origins = app.config.get("CORS_ORIGINS", "*")
    if isinstance(cors_origins, str) and cors_origins != "*":
        cors_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    if db_backend in {"mongo", "both"}:
        init_db(app)
        with app.app_context():
            ensure_user_indexes()
            ensure_student_indexes()
            ensure_attendance_indexes()
            ensure_grade_indexes()
            ensure_marks_indexes()

    if db_backend in {"mysql", "both"}:
        init_mysql(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(grade_bp)
    app.register_blueprint(marks_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(resource_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(ml_integration_bp)

    @app.get("/")
    def root_status():
        return jsonify(
            {
                "message": "Backend Running",
                "api_base": "/api",
                "database": db_backend,
            }
        )

    @app.get("/api")
    def api_index():
        return jsonify(
            {
                "message": "EduTrack API index",
                "endpoints": {
                    "auth": "/api/auth",
                    "students": "/api/students",
                    "attendance": "/api/attendance",
                    "marks": "/api/marks",
                    "grades": "/api/grades",
                    "analytics": "/api/analytics",
                    "risk": "/api/risk",
                    "prediction": "/api/predict-cgpa",
                    "events": "/api/events",
                    "resources": "/api/resources",
                    "system": "/api/system",
                },
            }
        )

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"error": "Route not found"}), 404

    @app.errorhandler(500)
    def handle_internal_error(_error):
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
