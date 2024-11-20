from cache.in_mem_cache import InMemCache
from firebase import db

import logging

# A thin wrapper around the users cache. Does the database fetch if the user
# is not in the cache (either due to a cold cache or invalidation)

user_cache = InMemCache("user")
user_cache_logging = False
user_cache_feature_enable = True

def fetch_user_from_db(zid):
    doc_ref = db.collection("users").document(zid)
    doc = doc_ref.get()

    try:
        if doc.exists:
            docData = doc.to_dict()
            user_cache.insert(zid, docData)
            return user_cache.get(zid)
        else:
            return None
    except:
        logging.error("fetch_user_from_db() connection to DB failed")
        return None

def get_user_cache(zid):
    if user_cache.exists(zid):
        if user_cache_logging:
            logging.critical(f"user cache HIT with zid {zid}")

        return user_cache.get(zid)
    else:
        if user_cache_logging:
            logging.critical(f"user cache MISS with zid {zid}, retrieving from DB")

        return fetch_user_from_db(zid)

# There is no user cache "set" so we can force a fresh DB read after a write.
# DB consistency bugs can be very sinister to debug.
def invalidate_user_cache(zid):
    if user_cache_logging:
        logging.critical(f"user cache INVALIDATE with zid {zid}")

    user_cache.invalidate(zid)