from pymongo import MongoClient

# Connect using the new Atlas URI
client = MongoClient("mongodb+srv://studyybugg_db_user:studyy1997@cluster0.g2hvglv.mongodb.net/")
db = client["EduTrackDB"]

try:
    print("Dropping conflicting index on students collection...")
    db.students.drop_index("student_id_1")
    print("Dropped student_id_1")
except Exception as e:
    print("Could not drop student_id_1:", e)

try:
    print("Dropping conflicting index on users collection...")
    db.users.drop_index("email_1")
    db.users.drop_index("username_1")
    print("Dropped user indexes")
except Exception as e:
    pass

try:
    print("Dropping any enrollment_id conflicts...")
    db.students.drop_index("enrollment_id_1")
except Exception as e:
    pass

print("Done. Atlas DB indexes cleared so app.py can securely recreate them.")
