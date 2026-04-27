from cachetools import TTLCache

cache: TTLCache = TTLCache(maxsize=128, ttl=900)
