from pymongo import MongoClient
from flask import current_app

_mongo_client = None


def init_db(app):
    """Initialize MongoDB connection and store it in Flask app extensions."""
    global _mongo_client

    _mongo_client = MongoClient(app.config["MONGO_URI"])
    db_name = app.config["MONGO_DB_NAME"]

    app.extensions["mongo_client"] = _mongo_client
    app.extensions["mongo_db"] = _mongo_client[db_name]



def get_db():
    """Return active MongoDB database instance for current Flask app context."""
    return current_app.extensions["mongo_db"]
