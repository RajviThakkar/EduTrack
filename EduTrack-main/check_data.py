import os
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from database.db import get_db

app = create_app()

with app.app_context():
    db = get_db()
    
    print('=== USERS COLLECTION ===')
    for user in db['users'].find():
        print(f"Name: {user.get('name')}, Email: {user.get('email')}, Role: {user.get('role')}")
    
    print('\n=== STUDENTS COLLECTION ===')
    for student in db['students'].find():
        print(f"Name: {student.get('name')}, Email: {student.get('email')}, ID: {student.get('student_id')}")

