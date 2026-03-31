from app import create_app
from database.db import get_db

app = create_app()

with app.app_context():
    db = get_db()
    students = list(db["students"].find({}, {"email": 1, "name": 1}))
    users = db["users"]

    missing = []
    invalid_role = []

    for student in students:
        email = str(student.get("email") or "").strip().lower()
        if not email:
            continue

        user = users.find_one({"email": email})
        if not user:
            missing.append(email)
            continue

        if str(user.get("role") or "").lower() != "student":
            invalid_role.append(email)

    print(f"Students checked: {len(students)}")
    print(f"Missing login users: {len(missing)}")
    print(f"Wrong role users: {len(invalid_role)}")

    if missing:
        print("Missing emails:")
        for email in missing:
            print(email)

    if invalid_role:
        print("Wrong role emails:")
        for email in invalid_role:
            print(email)
