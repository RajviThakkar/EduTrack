import csv
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models.student_model import create_student
import bcrypt
from models.user_model import find_user_by_email
from database.db import get_db

app = create_app()

DEFAULT_STUDENT_PASSWORD = "student123"

def _default_student_password_hash():
    return bcrypt.hashpw(DEFAULT_STUDENT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def _sync_student_login_account(name, email):
    normalized_email = str(email or "").strip().lower()
    normalized_name = str(name or "").strip() or "Student"
    if not normalized_email:
        return "Student email is required to create login credentials"

    existing_user = find_user_by_email(normalized_email)
    password_hash = _default_student_password_hash()

    if existing_user:
        if str(existing_user.get("role", "")).lower() != "student":
            return "This email is already used by a non-student account"

        if existing_user.get("_id") is not None:
            get_db()["users"].update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"name": normalized_name, "password": password_hash, "role": "student"}},
            )
            return None

    get_db()["users"].insert_one({
        "name": normalized_name,
        "email": normalized_email,
        "password": password_hash,
        "role": "student",
    })
    return None

def import_csv(csv_path):
    with app.app_context():
        created_count = 0
        error_count = 0
        errors = []

        # Use utf-8-sig to handle BOM (Byte Order Mark)
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
                try:
                    # Debug: Print first row to see what we're getting
                    if row_num == 2:
                        print(f"Debug - First row keys: {list(row.keys())}")
                        print(f"Debug - First row values: {row}")
                    
                    # Map CSV columns to student model
                    student_id_raw = row.get('Student ID', '') or ''
                    student_data = {
                        'student_id': str(student_id_raw).strip(),
                        'name': str(row.get('Full Name', '') or '').strip(),
                        'branch': str(row.get('Branch', '') or '').strip(),
                        'semester': int(str(row.get('Semester', 0) or 0).strip()) if str(row.get('Semester', 0) or '').strip() else 0,
                        'batch': str(row.get('Batch', '') or '').strip(),
                        'enrollment_id': str(row.get('Enrollment ID', '') or '').strip(),
                        'email': str(row.get('Email', '') or '').strip().lower(),
                        'year': str(row.get('Year', '') or '').strip(),
                    }

                    # Validate required fields
                    if not student_data['student_id']:
                        errors.append(f"Row {row_num}: Missing Student ID")
                        error_count += 1
                        continue
                    if not student_data['email']:
                        errors.append(f"Row {row_num}: Missing Email")
                        error_count += 1
                        continue

                    # Create student
                    created = create_student(student_data)
                    
                    # Sync login account
                    sync_error = _sync_student_login_account(
                        name=student_data.get('name'),
                        email=student_data.get('email')
                    )
                    
                    if sync_error:
                        errors.append(f"Row {row_num}: Login sync failed: {sync_error}")
                        error_count += 1
                    else:
                        created_count += 1
                        print(f"✓ Created student: {student_data['name']} ({student_data['student_id']})")

                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    error_count += 1
                    print(f"✗ Error at row {row_num}: {str(e)}")

        print(f"\n=== Import Summary ===")
        print(f"Created: {created_count}")
        print(f"Failed: {error_count}")
        if errors:
            print(f"\nErrors:")
            for error in errors[:10]:  # Show first 10 errors
                print(f"  - {error}")
            if len(errors) > 10:
                print(f"  ... and {len(errors) - 10} more")

if __name__ == '__main__':
    csv_path = '../addstudent.csv'  # Path relative to this script
    current_dir = os.path.dirname(__file__)
    full_path = os.path.join(current_dir, csv_path)
    
    if not os.path.exists(full_path):
        # Try alternate path
        full_path = os.path.join(current_dir, '..', 'addstudent.csv')
    
    if not os.path.exists(full_path):
        print(f"Error: CSV file not found at {full_path}")
        sys.exit(1)
    
    print(f"Importing students from: {full_path}")
    import_csv(full_path)
