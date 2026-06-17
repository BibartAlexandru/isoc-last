from google.oauth2 import id_token
from google.auth.transport import requests


def verify_google_token(token: str):

    try:

        data = id_token.verify_oauth2_token(
            token,
            requests.Request()
        )

        return {
            "email": data["email"],
            "name": data["name"]
        }

    except Exception:

        return None
