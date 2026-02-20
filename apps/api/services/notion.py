from core.config import get_settings
import httpx

settings = get_settings()

class NotionService:
    @staticmethod
    async def create_page(token: str, data: dict):
        # TODO: Implement Notion page creation
        pass

    @staticmethod
    async def exchange_code_for_token(code: str):
        # TODO: Implement OAuth code exchange
        pass
