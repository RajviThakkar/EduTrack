from pathlib import Path

import mysql.connector
from flask import current_app


class MySQLInitError(RuntimeError):
    """Raised when MySQL bootstrap fails."""


def _mysql_settings(app):
    return {
        "host": app.config["MYSQL_HOST"],
        "port": app.config["MYSQL_PORT"],
        "user": app.config["MYSQL_USER"],
        "password": app.config["MYSQL_PASSWORD"],
        "database": app.config["MYSQL_DATABASE"],
    }


def _schema_file_path():
    return Path(__file__).with_name("schema_mysql.sql")


def _create_database_if_missing(settings):
    conn = mysql.connector.connect(
        host=settings["host"],
        port=settings["port"],
        user=settings["user"],
        password=settings["password"],
    )
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{settings['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        conn.commit()
    finally:
        conn.close()


def _apply_schema(settings):
    schema_path = _schema_file_path()
    if not schema_path.exists():
        raise MySQLInitError(f"Schema file not found: {schema_path}")

    sql = schema_path.read_text(encoding="utf-8")
    conn = mysql.connector.connect(**settings)
    try:
        cursor = conn.cursor()
        for _ in cursor.execute(sql, multi=True):
            pass
        conn.commit()
    finally:
        conn.close()


def init_mysql(app):
    """Initialize MySQL settings and optionally bootstrap schema."""
    settings = _mysql_settings(app)
    _create_database_if_missing(settings)

    if app.config.get("MYSQL_AUTO_INIT_SCHEMA", False):
        _apply_schema(settings)

    app.extensions["mysql_settings"] = settings


def get_mysql_connection():
    settings = current_app.extensions.get("mysql_settings")
    if not settings:
        raise MySQLInitError("MySQL is not initialized. Set DB_BACKEND=mysql|both and restart app.")
    return mysql.connector.connect(**settings)


def mysql_ping():
    """Return True if a basic SELECT 1 succeeds."""
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        row = cursor.fetchone()
        return bool(row and row[0] == 1)
    finally:
        conn.close()
