#!/usr/bin/env python
"""
Fix user passwords in the database with correct bcrypt hashes.
Usage: python fix_auth.py
"""

import sys
import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

# Get MySQL connection settings from environment
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "edutrack")

# Correct bcrypt hashes for passwords
USERS_TO_UPDATE = [
    ('ananya.sharma@edutrack.edu', '$2b$12$wnTkIdB5tLtqG2cWKjkaG.c9ptBCRpeVocpgrsOVZTri8N8tHunSC', 'faculty123'),
    ('ravi.kumar@edutrack.edu', '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG', 'student123'),
    ('neha.patel@edutrack.edu', '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG', 'student123'),
    ('counsellor@edutrack.edu', '$2b$12$RGugp8TWML8tf1viom2QyeDGNSULRJZevdl3Y.BE69KS5XzfSjQbG', 'counsellor123'),
]

try:
    print(f"Connecting to MySQL: {MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}")
    
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE
    )
    cursor = conn.cursor(dictionary=True)
    
    print("Updating user passwords...")
    for email, password_hash, password_note in USERS_TO_UPDATE:
        cursor.execute(
            'UPDATE users SET password = %s WHERE email = %s',
            (password_hash, email)
        )
        rows_affected = cursor.rowcount
        print(f"  ✓ {email} ({password_note}) - {rows_affected} row(s) updated")
    
    conn.commit()
    print("\n✓ All passwords updated successfully!")
    
    # Verify the update
    print("\nVerifying updated users:")
    cursor.execute('SELECT user_id, name, email, role FROM users')
    for user in cursor.fetchall():
        print(f"  - {user['name']} ({user['email']}) - {user['role']}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
finally:
    try:
        if conn.is_connected():
            cursor.close()
            conn.close()
    except:
        pass
