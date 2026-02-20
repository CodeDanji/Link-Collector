from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio
import uuid
from arq import create_pool
from arq.connections import RedisSettings
from core.config import get_settings
from core.rate_limit import RateLimitService
from core.auth import UserProfile, check_usage_quota
from pydantic import BaseModel
from services.scraper import ScraperService
from services.youtube import YouTubeService
from services.llm import LLMService
from datetime import datetime
from urllib.parse import urlparse

load_dotenv()
settings = get_settings()
parsed_url = urlparse(settings.REDIS_URL)

app = FastAPI(title="Link-Collector API", version="2.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Redis Pool
redis_pool = None

@app.on_event("startup")
async def startup_event():
    global redis_pool
    # Initialize the Arq connection pool
    redis_pool = await create_pool(
        RedisSettings(
            host=parsed_url.hostname or "localhost",
            port=parsed_url.port or 6379,
            database=0
        )
    )

@app.on_event("shutdown")
async def shutdown_event():
    global redis_pool
    if redis_pool:
        redis_pool.close()
        await redis_pool.wait_closed()

# The actual task logic. Arq injects `ctx` as the first argument.
async def process_url_task(ctx, job_id: str, url: str, user_id: str, language: str = "Auto"):
    print(f"Processing URL: {url} (Job: {job_id}) Language: {language}")
    
    try:
        content = ""
        # 1. Determine type (YouTube vs Web)
        if "youtube.com" in url or "youtu.be" in url:
            yt_service = YouTubeService()
            result = await yt_service.process_video(url)
            content = result.get("content", "")
        else:
            from services.scraper import ScraperService
            result = await ScraperService.extract_content(url)
            content = result.get("content", "")
            
        # 2. Summarize
        if content:
             import json
             summary_json_str = await LLMService.summarize_content(content, language=language)
             try:
                 summary_data = json.loads(summary_json_str)
             except:
                 summary_data = {"summary": summary_json_str} # Fallback if parsing fails

             return {
                 "data": summary_data,
                 "original_url": url,
                 "processed_at": str(datetime.now())
             }
        else:
             raise Exception("No content extracted")
             
    except Exception as e:
        print(f"Job failed: {e}")
        raise e

class ProcessRequest(BaseModel):
    url: str
    user_id: str = "demo_user"
    language: str = "Auto"

@app.get("/")
def read_root():
    return {"message": "Link-Collector API v2.0 is running (Redis Production Mode)", "status": "ok"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/process")
async def process_url(
    request: ProcessRequest, 
    profile: UserProfile = Depends(check_usage_quota)
):
    global redis_pool
    
    # Generate Job ID
    job_id = str(uuid.uuid4())
    
    # Enqueue Background Task via Arq directly to Redis
    if redis_pool:
        await redis_pool.enqueue_job("process_url_task", job_id, request.url, profile.user_id, request.language, _job_id=job_id)
    else:
        raise HTTPException(status_code=500, detail="Redis connection failed")
    
    return {
        "job_id": job_id, 
        "status": "queued",
        "remaining_quota": profile.monthly_credits # Real tracking to be implemented
    }

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    global redis_pool
    if not redis_pool:
         raise HTTPException(status_code=500, detail="Redis connection failed")
         
    # Query Arq for the Job Status
    job = await redis_pool.job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    status = await job.status()
    # status is an Enum: queued, deferred, in_progress, complete, not_found
    
    if status.value == "complete":
        result = await job.result()
        return {
            "status": "completed",
            "result": result
        }
    elif status.value == "in_progress":
         return {"status": "processing"}
    elif status.value == "queued":
         return {"status": "queued"}
    else:
         # Check if it failed by fetching the result
         try:
             await job.result()
             return {"status": "failed", "error": "Unknown error"}
         except Exception as e:
             return {"status": "failed", "error": str(e)}
