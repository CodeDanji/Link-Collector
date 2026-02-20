from arq.connections import RedisSettings
from core.config import get_settings

settings = get_settings()

async def startup(ctx):
    print("Worker starting up...")
    # Initialize any heavy connections here, e.g. persistent DB pools

async def shutdown(ctx):
    print("Worker shutting down...")

# In real structure we import from services natively
from main import process_url_task

from urllib.parse import urlparse

# Parse the redis url to pass down
parsed_url = urlparse(settings.REDIS_URL)

class WorkerSettings:
    functions = [process_url_task]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings(
        host=parsed_url.hostname or "localhost",
        port=parsed_url.port or 6379,
        database=0
    )
