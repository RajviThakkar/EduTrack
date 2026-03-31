import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from database.db import get_db


def build_student_id(index):
    return f"AUTO-STU-{index:03d}"


app = create_app()

with app.app_context():
    db = get_db()
    users = list(db['users'].find({'role': 'student'}))
    students = db['students']

    created = 0
    updated = 0

    for idx, user in enumerate(users, start=1):
        email = str(user.get('email', '')).strip().lower()
        name = str(user.get('name', '')).strip() or 'Student'

        if not email:
            continue

        existing = students.find_one({'email': email})

        payload = {
            'name': name,
            'email': email,
            'branch': 'CSE',
            'semester': 5,
            'batch': 'A',
            'year': '3',
            'counsellor_name': 'Counsellor Admin',
            'cgpa': 0.0,
            'attendance_percentage': 0.0,
        }

        if existing:
            students.update_one({'_id': existing['_id']}, {'$set': payload})
            updated += 1
        else:
            student_id = build_student_id(idx)
            payload.update({
                'student_id': student_id,
                'enrollment_id': student_id,
            })
            students.insert_one(payload)
            created += 1

    print(f"Student profiles synced. Created: {created}, Updated: {updated}")
