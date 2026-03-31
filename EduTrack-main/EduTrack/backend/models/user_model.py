from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

from database.db import get_db
from database.mysql_db import get_mysql_connection


def _is_mysql_backend():
    return current_app.config.get("DB_BACKEND", "mongo").lower() in {"mysql", "both"}


def _users_collection():
    return get_db()["users"]


def ensure_user_indexes():
    """Create required indexes for the active backend."""
    if _is_mysql_backend():
        return
    _users_collection().create_index("email", unique=True)


def _serialize_user(document):
    if not document:
        return None

    if _is_mysql_backend():
        return {
            "id": str(document.get("user_id")),
            "name": document.get("name"),
            "email": document.get("email"),
            "role": document.get("role"),
            "created_at": document.get("created_at"),
        }

    return {
        "id": str(document["_id"]),
        "name": document.get("name"),
        "email": document.get("email"),
        "role": document.get("role"),
        "created_at": document.get("created_at"),
    }


def find_user_by_email(email):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT user_id, name, email, password, role, created_at FROM users WHERE email = %s",
                (email,),
            )
            return cursor.fetchone()
        finally:
            conn.close()

    return _users_collection().find_one({"email": email})


def find_user_document_by_id(user_id):
    if _is_mysql_backend():
        try:
            numeric_id = int(user_id)
        except (TypeError, ValueError):
            return None

        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT user_id, name, email, password, role, created_at FROM users WHERE user_id = %s",
                (numeric_id,),
            )
            return cursor.fetchone()
        finally:
            conn.close()

    try:
        return _users_collection().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def find_user_by_id(user_id):
    return _serialize_user(find_user_document_by_id(user_id))


def create_user(name, email, password_hash, role):
    if _is_mysql_backend():
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                (name, email, password_hash, role),
            )
            conn.commit()
            return find_user_by_id(cursor.lastrowid)
        finally:
            conn.close()

    payload = {
        "name": name,
        "email": email,
        "password": password_hash,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    inserted = _users_collection().insert_one(payload)
    return find_user_by_id(inserted.inserted_id)