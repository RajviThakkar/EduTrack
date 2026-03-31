from flask import Blueprint, current_app, jsonify

from database.mysql_db import mysql_ping

system_bp = Blueprint("system", __name__, url_prefix="/api/system")


@system_bp.get("/db-health")
def db_health():
    backend = current_app.config.get("DB_BACKEND", "mongo").lower()
    status = {"backend": backend}

    if backend in {"mongo", "both"}:
        mongo_db = current_app.extensions.get("mongo_db")
        status["mongo"] = {"connected": mongo_db is not None}

    if backend in {"mysql", "both"}:
        try:
            status["mysql"] = {"connected": mysql_ping()}
        except Exception as error:
            status["mysql"] = {"connected": False, "error": str(error)}

    healthy = all(
        item.get("connected", True)
        for key, item in status.items()
        if isinstance(item, dict) and key in {"mongo", "mysql"}
    )

    return jsonify({"ok": healthy, "status": status}), (200 if healthy else 503)
