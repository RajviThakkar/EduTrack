import bcrypt
from app import create_app
from database.db import get_db

DEFAULT_PASSWORD = "student123"


app = create_app()

with app.app_context():
    db = get_db()
    students = list(db["students"].find())
    users = db["users"]

    created_count = 0
    updated_count = 0
    skipped_non_student_count = 0

    for student in students:
        email = str(student.get("email") or "").strip().lower()
        name = str(student.get("name") or "Student").strip() or "Student"
        if not email:
            continue

        password_hash = bcrypt.hashpw(DEFAULT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        existing_user = users.find_one({"email": email})

        if existing_user:
            if str(existing_user.get("role") or "").lower() != "student":
                skipped_non_student_count += 1
                continue

            users.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": {
                        "name": name,
                        "role": "student",
                        "password": password_hash,
                    }
                },
            )
            updated_count += 1
        else:
            users.insert_one(
                {
                    "name": name,
                    "email": email,
                    "role": "student",
                    "password": password_hash,
                }
            )
            created_count += 1

    print(
        f"Student login sync complete. Created: {created_count}, Updated: {updated_count}, "
        f"Skipped(non-student email conflicts): {skipped_non_student_count}"
    )
