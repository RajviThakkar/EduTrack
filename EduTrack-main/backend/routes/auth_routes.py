from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import Blueprint, current_app, g, jsonify, request

from models.user_model import create_user, find_user_by_email, find_user_by_id, find_user_document_by_id, get_users_by_roles

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _generate_token(user_document):
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=current_app.config["JWT_ACCESS_TOKEN_EXPIRES_HOURS"]
    )
    payload = {
        "sub": str(user_document.get("_id") or user_document.get("user_id") or user_document.get("id")),
        "email": user_document.get("email"),
        "role": user_document.get("role"),
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm=current_app.config["JWT_ALGORITHM"],
    )


def _get_bearer_token():
    authorization_header = request.headers.get("Authorization", "")
    parts = authorization_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def token_required(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        token = _get_bearer_token()
        if not token:
            return jsonify({"error": "Authorization token is required"}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config["JWT_SECRET_KEY"],
                algorithms=[current_app.config["JWT_ALGORITHM"]],
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        user_document = find_user_document_by_id(payload.get("sub"))
        if not user_document:
            return jsonify({"error": "User not found"}), 404

        g.current_user = {
            "id": str(user_document.get("_id") or user_document.get("user_id") or user_document.get("id")),
            "name": user_document.get("name"),
            "email": user_document.get("email"),
            "role": user_document.get("role"),
        }
        return route_function(*args, **kwargs)

    return wrapper


# Register a new user and store the password securely with bcrypt.
@auth_bp.route("/register", methods=["POST"])
def register_user():
    try:
        data = request.get_json(silent=True) or {}
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", "")).strip()
        role = str(data.get("role", "")).strip().lower()

        if not all([name, email, password, role]):
            return jsonify({"error": "name, email, password and role are required"}), 400

        # Students cannot self-register - only counsellors can add them
        if role == "student":
            return jsonify({"error": "Students cannot self-register. Students must be added by a counsellor."}), 403

        if role not in {"admin", "faculty", "counsellor"}:
            return jsonify({"error": "role must be admin, faculty, or counsellor"}), 400

        if find_user_by_email(email):
            return jsonify({"error": "User already exists with this email"}), 409

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_document = create_user(name=name, email=email, password_hash=password_hash, role=role)
        
        # Generate token for immediate login
        token = _generate_token(user_document)
        user = find_user_by_id(user_document.get("_id") or user_document.get("user_id") or user_document.get("id"))
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "access_token": token,
            "user": user
        }), 201
    except Exception as error:
        return jsonify({"error": f"Failed to register user: {str(error)}"}), 500


# Authenticate a user and return a JWT token for frontend requests.
@auth_bp.route("/login", methods=["POST"])
def login_user():
    try:
        data = request.get_json(silent=True) or {}
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        if not email or not password:
            return jsonify({"error": "email and password are required"}), 400

        user_document = find_user_by_email(email)
        if not user_document:
            return jsonify({"error": "Invalid email or password"}), 401

        password_matches = bcrypt.checkpw(
            password.encode("utf-8"), user_document["password"].encode("utf-8")
        )
        if not password_matches:
            return jsonify({"error": "Invalid email or password"}), 401

        token = _generate_token(user_document)
        return jsonify(
            {
                "message": "Login successful",
                "token": token,
                "access_token": token,
                "user": find_user_by_id(user_document.get("_id") or user_document.get("user_id") or user_document.get("id")),
            }
        )
    except Exception as error:
        return jsonify({"error": f"Failed to login: {str(error)}"}), 500


# Return the profile details for the currently authenticated user.
@auth_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    try:
        return jsonify({"user": g.current_user})
    except Exception as error:
        return jsonify({"error": f"Failed to fetch profile: {str(error)}"}), 500

@auth_bp.route("/users", methods=["GET"])
def get_users_list():
    try:
        roles_str = request.args.get("role")
        roles = roles_str.split(",") if roles_str else []
        users = get_users_by_roles(roles) if roles else []
        return jsonify(users)
    except Exception as error:
        return jsonify({"error": f"Failed to fetch users: {str(error)}"}), 500
