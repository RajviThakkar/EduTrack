#!/usr/bin/env python
"""
Seed MongoDB with initial test users.
Run from backend directory: python seed_users.py
"""

import sys
from datetime import datetime, timezone
from app import create_app

# Test credentials
TEST_USERS = [
    {
        'name': 'Dr. Ananya Sharma',
        'email': 'ananya.sharma@edutrack.edu',
        'password': '$2b$12$wnTkIdB5tLtqG2cWKjkaG.c9ptBCRpeVocpgrsOVZTri8N8tHunSC',
        'role': 'faculty'
    },
    {
        'name': 'Ravi Kumar',
        'email': 'ravi.kumar@edutrack.edu',
        'password': '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG',
        'role': 'student'
    },
    {
        'name': 'Neha Patel',
        'email': 'neha.patel@edutrack.edu',
        'password': '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG',
        'role': 'student'
    },
    {
        'name': 'Counsellor Admin',
        'email': 'counsellor@edutrack.edu',
        'password': '$2b$12$RGugp8TWML8tf1viom2QyeDGNSULRJZevdl3Y.BE69KS5XzfSjQbG',
        'role': 'counsellor'
    }
]

def seed_mongodb():
    """Insert test users into MongoDB"""
    try:
        app = create_app()
        
        with app.app_context():
            from database.db import get_db
            
            db = get_db()
            users_collection = db['users']
            
            print("Seeding MongoDB with test users...")
            print("=" * 60)
            
            for user_data in TEST_USERS:
                email = user_data['email']
                
                # Check if user already exists
                existing = users_collection.find_one({'email': email})
                
                if existing:
                    # Update existing user
                    result = users_collection.update_one(
                        {'email': email},
                        {'$set': {
                            'name': user_data['name'],
                            'password': user_data['password'],
                            'role': user_data['role']
                        }}
                    )
                    print(f"✓ Updated: {email}")
                else:
                    # Insert new user
                    user_doc = {
                        'name': user_data['name'],
                        'email': email,
                        'password': user_data['password'],
                        'role': user_data['role'],
                        'created_at': datetime.now(timezone.utc).isoformat()
                    }
                    result = users_collection.insert_one(user_doc)
                    print(f"✓ Created: {email}")
            
            # Verify
            print("\n" + "=" * 60)
            print("Users in database:")
            print("=" * 60)
            for user in users_collection.find()[:10]:
                print(f"  - {user.get('name')} ({user.get('email')}) - {user.get('role')}")
            
            print("\n✓ Database seeded successfully!")
            print("\nTest Credentials:")
            print("=" * 60)
            
            # Map emails to actual test passwords
            password_map = {
                'ananya.sharma@edutrack.edu': 'faculty123',
                'ravi.kumar@edutrack.edu': 'student123',
                'neha.patel@edutrack.edu': 'student123',
                'counsellor@edutrack.edu': 'counsellor123'
            }
            
            for user in TEST_USERS:
                email = user['email']
                pwd = password_map.get(email, 'N/A')
                print(f"  Email:    {email}")
                print(f"  Password: {pwd}")
                print(f"  Role:     {user['role']}\n")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    seed_mongodb()
