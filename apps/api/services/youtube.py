from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import yt_dlp
import os
import uuid
from services.audio import AudioService
# Import ScraperService for fallback
 

class YouTubeService:
    def __init__(self):
        self.audio_service = AudioService()
        self.download_path = "downloads"
        os.makedirs(self.download_path, exist_ok=True)

    def get_video_id(self, url: str) -> str:
        # Simple extraction, can be improved with regex
        if "v=" in url:
            return url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in url:
            return url.split("youtu.be/")[1].split("?")[0]
        return ""

    async def process_video(self, url: str):
        video_id = self.get_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")

        # 1. Try fetching existing transcript (Fastest & Best Quality)
        try:
            print(f"Attempting Transcript API for {video_id}")
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            formatter = TextFormatter()
            text = formatter.format_transcript(transcript_list)
            return {"method": "transcript_api", "content": text}
        except Exception as e:
            print(f"Transcript API failed: {e}. Falling back to Whisper...")

        # 2. Fallback: Download audio & Transcribe
        try:
            print(f"Attempting Audio Download for {url}")
            return await self._download_and_transcribe(url)
        except Exception as e:
            print(f"Whisper fallback failed: {e}. Falling back to Metadata Scrape.")
            
        # 3. Last Resort: yt-dlp Metadata (Title + Description)
        # Much improved over raw HTML scraping
        try:
            print(f"Attempting yt-dlp Metadata Fallback for {url}")
            return await self._get_metadata_fallback(url)
        except Exception as e:
            print(f"Metadata fallback failed: {e}")

        raise Exception("Failed to process YouTube video (Transcript, Audio, and Metadata all failed).")

    async def _get_metadata_fallback(self, url: str):
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'extract_flat': True, # Don't download, just get metadata
        }
        
        try:
            import asyncio
            def run_metadata():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    return ydl.extract_info(url, download=False)
            
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, run_metadata)
            
            if not info:
                raise ValueError("No metadata found")
                
            title = info.get('title', 'Unknown Title')
            description = info.get('description', 'No description available.')
            
            content = f"VIDEO TITLE: {title}\n\nVIDEO DESCRIPTION:\n{description}\n\n[NOTE: Full transcript was unavailable. Summary is based on video metadata.]"
            return {"method": "metadata_fallback", "content": content}
            
        except Exception as e:
            raise e

    async def _download_and_transcribe(self, url: str):
        file_id = str(uuid.uuid4())
        # The filename template for yt-dlp
        # We use a temporary filename that yt-dlp will write to
        output_template = os.path.join(self.download_path, f"{file_id}.%(ext)s")
        
        # We expect mp3 because of the postprocessor
        final_filepath = os.path.join(self.download_path, f"{file_id}.mp3")

        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'source_address': '0.0.0.0', # Enforce IPv4
            # Use Android client to bypass some 403s
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web'],
                }
            },
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        }

        try:
            # Run blocking yt-dlp in a thread to avoid blocking the event loop
            import asyncio
            
            def run_yt_dlp():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, run_yt_dlp)
            
            if not os.path.exists(final_filepath):
                # Check for other extensions just in case
                base_path = os.path.join(self.download_path, file_id)
                found = False
                for ext in ['.webm', '.m4a', '.mp3']:
                    if os.path.exists(base_path + ext):
                        final_filepath = base_path + ext
                        found = True
                        break
                if not found:
                    raise FileNotFoundError(f"Audio file not found at {final_filepath}")

            text = self.audio_service.transcribe(final_filepath)
            
            # Cleanup
            if os.path.exists(final_filepath):
                os.remove(final_filepath)
                
            return {"method": "whisper", "content": text}
            
        except Exception as e:
            print(f"Download/Transcribe failed: {e}")
            if os.path.exists(final_filepath):
                # Cleanup potential partial files
                try:
                    os.remove(final_filepath)
                except: 
                    pass
            raise e
