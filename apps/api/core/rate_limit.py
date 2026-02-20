from core.config import get_settings
from fastapi import HTTPException
from datetime import datetime

settings = get_settings()

# In-memory storage for rate limiting (dev/demo only)
rate_limit_store = {}

class RateLimitService:
    async def check_rate_limit(self, user_id: str):
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"{user_id}:{today}"
        
        current_count = rate_limit_store.get(key, 0)
        rate_limit_store[key] = current_count + 1
        
        if rate_limit_store[key] > settings.DEFAULT_DAILY_QUOTA:
            raise HTTPException(status_code=429, detail="Daily quota exceeded")
            
        return True

    async def get_remaining_quota(self, user_id: str) -> int:
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"{user_id}:{today}"
        current = rate_limit_store.get(key, 0)
        return max(0, settings.DEFAULT_DAILY_QUOTA - current)
