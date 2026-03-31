from database.db import get_db


def _resources_collection():
    return get_db()["resources"]


def _serialize_resource(document):
    if not document:
        return None

    return {
        "id": str(document["_id"]),
        "title": document.get("title"),
        "author": document.get("author"),
        "category": document.get("category"),
        "link": document.get("link"),
    }


def get_all_resources():
    cursor = _resources_collection().find().sort("_id", -1)
    return [_serialize_resource(item) for item in cursor]


def create_resource(payload):
    inserted = _resources_collection().insert_one(payload)
    document = _resources_collection().find_one({"_id": inserted.inserted_id})
    return _serialize_resource(document)
