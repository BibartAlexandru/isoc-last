from jose import jwt
import os

SECRET = os.environ.get('JWT_SECRET')


def create_token(user_id, email, name):

    return jwt.encode(
        {
            "user_id": user_id,
            "email": email,
            "name": name
        },
        SECRET,
        algorithm="HS256"
    )
