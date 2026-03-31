from datetime import datetime

from flask import Blueprint, jsonify, request

from models.event_model import create_event, delete_event, get_all_events

event_bp = Blueprint("events", __name__, url_prefix="/api/events")


# Return all academic events for the frontend calendar or notices view.
@event_bp.route("", methods=["GET"])
def get_events():
    try:
        return jsonify(get_all_events())
    except Exception as error:
        return jsonify({"error": f"Failed to fetch events: {str(error)}"}), 500


# Create a new academic event with a valid ISO date value.
@event_bp.route("", methods=["POST"])
def create_event_route():
    try:
        data = request.get_json(silent=True) or {}
        title = str(data.get("title", "")).strip()
        description = str(data.get("description", "")).strip() or None
        event_date = str(data.get("event_date", "")).strip()

        if not title or not event_date:
            return jsonify({"error": "title and event_date are required"}), 400

        datetime.fromisoformat(event_date)
        event = create_event({"title": title, "description": description, "event_date": event_date})
        return jsonify({"message": "Event created successfully", "event": event}), 201
    except ValueError:
        return jsonify({"error": "event_date must be in ISO format"}), 400
    except Exception as error:
        return jsonify({"error": f"Failed to create event: {str(error)}"}), 500


# Delete an academic event by its MongoDB ObjectId.
@event_bp.route("/<string:event_id>", methods=["DELETE"])
def delete_event_route(event_id):
    try:
        if not delete_event(event_id):
            return jsonify({"error": "Event not found"}), 404
        return jsonify({"message": "Event deleted successfully"})
    except Exception as error:
        return jsonify({"error": f"Failed to delete event: {str(error)}"}), 500
