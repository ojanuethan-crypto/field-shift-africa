from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Shared rate limiter. Initialised in create_app(); limits are read from app.config at request time.
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
