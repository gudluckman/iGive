import firebase_admin
from firebase_admin import credentials, firestore, storage

# Use a service account.
cred = credentials.Certificate("service_account.json")

firebase_admin.initialize_app(cred)

db = firestore.client()

firebase_admin.initialize_app(
    cred, {"storageBucket": "igive-apacdreamteam.appspot.com"}, name="storage"
)

bucket = storage.bucket(app=firebase_admin.get_app("storage"))
