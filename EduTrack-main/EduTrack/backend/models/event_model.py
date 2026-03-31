from bson import ObjectId

from database.db import get_db


def _events_collection():
    return get_db()["events"]


def _serialize_event(document):
    if not document:
        return None

    return {
        "id": str(document["_id"]),
        "title": document.get("title"),
        "description": document.get("description"),
        "event_date": document.get("event_date"),
    }


def get_all_events():
    cursor = _events_collection().find().sort("event_date", 1)
    return [_serialize_event(item) for item in cursor]


def create_event(payload):
    inserted = _events_collection().insert_one(payload)
    document = _events_collection().find_one({"_id": inserted.inserted_id})
    return _serialize_event(document)


def delete_event(event_id):
    try:
        result = _events_collection().delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count > 0
    except Exception:
        return False
