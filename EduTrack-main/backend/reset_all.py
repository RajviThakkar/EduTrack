import sys
from app import create_app
from database.db import get_db

def reset_all_student_passwords():
    app = create_app()
    with app.app_context():
        db = get_db()
        hashed_password = "$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG"
        result = db.users.update_many({'role': 'student'}, {'$set': {'password': hashed_password}})
        print(f"Success! Updated {result.modified_count} student passwords back to 'student123'.")

if __name__ == '__main__':
    reset_all_student_passwords()
