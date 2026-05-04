#!/usr/bin/env python
"""
Seed MongoDB with initial test users.
Run from backend directory: python seed_users.py
"""

import sys
from datetime import datetime, timezone
import bcrypt
from app import create_app

# Test credentials with plain text passwords - will be hashed
TEST_USERS = [
    {
        'name': 'Admin User',
        'email': 'admin@edutrack.edu',
        'password': 'admin123',
        'role': 'admin'
    },
    {
        'name': 'Dr. Ananya Sharma',
        'email': 'faculty@edutrack.edu',
        'password': 'faculty123',
        'role': 'faculty'
    },
    {
        'name': 'Ravi Kumar',
        'email': 'student@edutrack.edu',
        'password': 'student123',
        'role': 'student'
    },
    {
        'name': 'Counsellor Admin',
        'email': 'counsellor@edutrack.edu',
        'password': 'counsellor123',
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
                # Hash the password
                password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Check if user already exists
                existing = users_collection.find_one({'email': email})
                
                if existing:
                    # Update existing user
                    result = users_collection.update_one(
                        {'email': email},
                        {'$set': {
                            'name': user_data['name'],
                            'password': password_hash,
                            'role': user_data['role']
                        }}
                    )
                    print(f"✓ Updated: {email}")
                else:
                    # Insert new user
                    user_doc = {
                        'name': user_data['name'],
                        'email': email,
                        'password': password_hash,
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
            
            # Show the actual credentials
            for user_data in TEST_USERS:
                print(f"  Email:    {user_data['email']}")
                print(f"  Password: {user_data['password']}")
                print(f"  Role:     {user_data['role']}\n")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    seed_mongodb()
