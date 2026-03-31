import bcrypt

from app import create_app
from database.db import get_db


def main():
    app = create_app()
    with app.app_context():
        db = get_db()

        db['users'].update_one(
            {'email': 'ananya.sharma@edutrack.edu'},
            {'$set': {'role': 'faculty'}},
        )

        db['users'].update_one(
            {'email': 'admin@edutrack.edu'},
            {
                '$set': {
                    'name': 'Admin',
                    'role': 'admin',
                    'password': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                }
            },
            upsert=True,
        )

        users = list(
            db['users'].find(
                {'email': {'$in': ['ananya.sharma@edutrack.edu', 'admin@edutrack.edu']}},
                {'_id': 0, 'email': 1, 'name': 1, 'role': 1},
            )
        )
        print(users)


if __name__ == '__main__':
    main()
