# A simple in memory cache implementation for iGive backend to reduce
# network traffic to the remote database. These functions are self-explanatory.

# It operates as a "write-through cache". Meaning writes bypasses the cache
# and read hits the cache. A DB write MUST be accompanied by a cache invalidation.

# Current assume a one server setup. In multiple server, you WILL need a cache coherency
# protocol to ensure all the cache are in sync.
class InMemCache:
    def __init__(self, cache_name):
        self.cache_name = cache_name
        self.kv_store = {}

    def name(self):
        return self.cache_name

    def insert(self, key, value):
        self.kv_store[key] = value
    
    def exists(self, key) -> bool:
        return key in self.kv_store

    def get(self, key):
        if self.exists(key):
            return self.kv_store[key]
        else:
            return None
    
    def invalidate(self, key):
        if self.exists(key):
            del self.kv_store[key]

    # This function is used to flush data in the cache to durable storage.

    # This function accepts a function pointer to a boolean function
    # of this form:
    # def flush_fn(key_to_flush, value_to_flush, private_arg) -> bool
    
    # private_arg is provided by the caller to pass data into the flush_fn
    #   such as a database instance.
    # The return value must be True on success or False on failure.
    def flush(self, key, flush_fn, private_arg) -> bool:
        if not self.exists(key):
            return False
        else:
            return flush_fn(key, self.kv_store[key], private_arg)
