from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Link-Collector"
    API_V1_STR: str = "/api/v1"
    
    # Redis
    REDIS_URL: str
    
    # Auth
    CLERK_SECRET_KEY: str
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: str
    
    # Supabase (Database)
    NEXT_PUBLIC_SUPABASE_URL: str
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str
    
    # AI Keys
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_API_KEY: str
    
    # Scraping
    PROXY_SERVER_URL: str = ""
    FIRECRAWL_API_KEY: str = ""
    
    # Notion
    NOTION_CLIENT_ID: str
    NOTION_CLIENT_SECRET: str
    NOTION_REDIRECT_URI: str
    
    # Business Logic
    DEFAULT_DAILY_QUOTA: int = 7
    REWARD_CREDIT_AMOUNT: int = 3
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

@lru_cache()
def get_settings():
    return Settings()
