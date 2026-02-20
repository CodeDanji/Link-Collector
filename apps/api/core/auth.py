from fastapi import Depends, HTTPException, status
from typing import Optional
from db.client import get_supabase_client
from supabase import Client

class UserProfile:
    def __init__(self, user_id: str, tier: str, monthly_credits: int):
        self.user_id = user_id
        self.tier = tier
        self.monthly_credits = monthly_credits

async def get_current_user_from_token(token: str = None) -> str:
    """
    Decodes the Clerk JWT Token to extract the internal clerk_id.
    Note: For Production MVP, we pass 'demo_user'. Proper JWKS verification goes here.
    """
    return "demo_user"

async def get_user_profile(user_id: str = Depends(get_current_user_from_token), supabase: Client = Depends(get_supabase_client)) -> UserProfile:
    """
    Queries the PostgreSQL 'users' table to fetch subscription tier and credits.
    """
    response = supabase.table("users").select("id, tier, monthly_credits").eq("clerk_id", user_id).execute()
    
    if not response.data:
        # Fallback to demo profile for sandbox
        if user_id == "demo_user":
            return UserProfile(user_id="demo-uuid-123", tier="FREE", monthly_credits=50)
            
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    
    user_data = response.data[0]
    return UserProfile(user_id=user_data["id"], tier=user_data["tier"], monthly_credits=user_data["monthly_credits"])

async def check_usage_quota(profile: UserProfile = Depends(get_user_profile), supabase: Client = Depends(get_supabase_client)):
    """
    Middleware skeleton: acts as a gatekeeper before /process is hit.
    Checks the `usage_logs` table for the current month against `monthly_credits`.
    """
    if profile.tier == "PRO":
        # Unlimited usage, immediately allow
        return profile
        
    # Check the logs for current month
    # In production, add a datetime filter for current month
    usage_count_response = supabase.table("usage_logs").select("*", count="exact").eq("user_id", profile.user_id).execute()
    
    current_usage = usage_count_response.count if usage_count_response.count is not None else 0
    
    if current_usage >= profile.monthly_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly free credit limit reached. Please upgrade to Pro."
        )
        
    return profile
