#!/usr/bin/env python
"""
Fix user passwords using Flask app context.
This script updates passwords with correct bcrypt hashes for authentication.
Run from backend directory: python fix_passwords_app.py
"""

import os
import sys
from app import create_app
from models.user_model import find_user_by_email, _users_collection
from database.mysql_db import get_mysql_connection

# Test credentials with their bcrypt hashes
TEST_USERS = {
    'ananya.sharma@edutrack.edu': {
        'password': '$2b$12$wnTkIdB5tLtqG2cWKjkaG.c9ptBCRpeVocpgrsOVZTri8N8tHunSC',
        'name': 'Dr. Ananya Sharma',
        'role': 'faculty'
    },
    'ravi.kumar@edutrack.edu': {
        'password': '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG',
        'name': 'Ravi Kumar',
        'role': 'student'
    },
    'neha.patel@edutrack.edu': {
        'password': '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG',
        'name': 'Neha Patel',
        'role': 'student'
    },
    'counsellor@edutrack.edu': {
        'password': '$2b$12$RGugp8TWML8tf1viom2QyeDGNSULRJZevdl3Y.BE69KS5XzfSjQbG',
        'name': 'Counsellor Admin',
        'role': 'counsellor'
    }
}

def fix_passwords_mysql():
    """Update passwords in MySQL database"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        print("Updating MySQL passwords...")
        for email, data in TEST_USERS.items():
            cursor.execute(
                'UPDATE users SET password = %s WHERE email = %s',
                (data['password'], email)
            )
            rows = cursor.rowcount
            print(f"  ✓ {email} - {rows} row(s) updated")
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"  ✗ MySQL Error: {e}")
        return False

def fix_passwords_mongo():
    """Update passwords in MongoDB"""
    try:
        print("Updating MongoDB passwords...")
        collection = _users_collection()
        
        for email, data in TEST_USERS.items():
            result = collection.update_one(
                {'email': email},
                {'$set': {'password': data['password']}}
            )
            print(f"  ✓ {email} - {result.modified_count} document(s) updated")
        
        return True
    except Exception as e:
        print(f"  ✗ MongoDB Error: {e}")
        return False

def main():
    try:
        app = create_app()
        
        with app.app_context():
            db_backend = app.config.get('DB_BACKEND', 'mongo').lower()
            print(f"Using database backend: {db_backend}")
            print("=" * 60)
            
            if db_backend == 'mysql':
                success = fix_passwords_mysql()
            elif db_backend == 'mongo':
                success = fix_passwords_mongo()
            else:
                success = fix_passwords_mysql() or fix_passwords_mongo()
            
            if success:
                print("\n✓ All passwords updated successfully!")
                print("\nTest Credentials:")
                print("=" * 60)
                for email, data in TEST_USERS.items():
                    print(f"  Email:    {email}")
                    print(f"  Password: {data['name'].split()[0].lower()}123")
                    print(f"  Role:     {data['role']}")
                    print()
            else:
                print("\n✗ Failed to update passwords")
                sys.exit(1)
                
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
