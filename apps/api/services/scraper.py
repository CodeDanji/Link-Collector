import trafilatura
from playwright.async_api import async_playwright
# from firecrawl import FirecrawlApp # Assuming firecrawl-py package usage
import os
from core.config import get_settings

settings = get_settings()

class ScraperService:
    @staticmethod
    async def extract_content(url: str):
        # L1: Trafilatura
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded)
                if text:
                    return {"method": "trafilatura", "content": text}
        except Exception as e:
            print(f"Trafilatura failed: {e}")

        # L2: Playwright
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                proxy = {"server": settings.PROXY_SERVER_URL} if settings.PROXY_SERVER_URL else None
                context = await browser.new_context(proxy=proxy)
                page = await context.new_page()
                await page.goto(url, timeout=30000)
                content = await page.content()
                text = trafilatura.extract(content) # Use trafilatura to clean HTML
                await browser.close()
                if text:
                    return {"method": "playwright", "content": text}
        except Exception as e:
            print(f"Playwright failed: {e}")

        # L3: Firecrawl (Fallback)
        if settings.FIRECRAWL_API_KEY:
            try:
                from firecrawl import FirecrawlApp
                app = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)
                scrape_result = app.scrape_url(url, params={'formats': ['markdown']})
                if scrape_result and scrape_result.get('markdown'):
                    return {"method": "firecrawl", "content": scrape_result['markdown']}
            except AttributeError:
                # Handle newer firecrawl-py versions where scrape_url is scrape
                try:
                    scrape_result = app.scrape(url, formats=['markdown'])
                    if scrape_result and scrape_result.get('markdown'):
                        return {"method": "firecrawl", "content": scrape_result['markdown']}
                except Exception as e:
                    print(f"Firecrawl failed: {e}")
            except Exception as e:
                print(f"Firecrawl failed: {e}")
            
        return {"method": "failed", "content": ""}

