from flask import Blueprint, jsonify, request

from models.resource_model import create_resource, get_all_resources

resource_bp = Blueprint("resources", __name__, url_prefix="/api/resources")


# Return all resources that can be displayed to the frontend.
@resource_bp.route("", methods=["GET"])
def get_resources():
    try:
        return jsonify(get_all_resources())
    except Exception as error:
        return jsonify({"error": f"Failed to fetch resources: {str(error)}"}), 500


# Create a new learning resource with title, author, category and link.
@resource_bp.route("", methods=["POST"])
def create_resource_route():
    try:
        data = request.get_json(silent=True) or {}
        title = str(data.get("title", "")).strip()
        author = str(data.get("author", "")).strip() or None
        category = str(data.get("category", "")).strip() or None
        link = str(data.get("link", "")).strip()

        if not title or not link:
            return jsonify({"error": "title and link are required"}), 400

        resource = create_resource(
            {
                "title": title,
                "author": author,
                "category": category,
                "link": link,
            }
        )
        return jsonify({"message": "Resource created successfully", "resource": resource}), 201
    except Exception as error:
        return jsonify({"error": f"Failed to create resource: {str(error)}"}), 500
