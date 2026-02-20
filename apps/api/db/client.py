from supabase import create_client, Client
from core.config import get_settings

settings = get_settings()

url: str = settings.NEXT_PUBLIC_SUPABASE_URL
key: str = settings.NEXT_PUBLIC_SUPABASE_ANON_KEY

# Dependency injection for Database
def get_supabase_client() -> Client:
    return create_client(url, key)
