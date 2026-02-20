from groq import Groq
from core.config import get_settings
import os

settings = get_settings()

class AudioService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def transcribe(self, file_path: str):
        try:
            with open(file_path, "rb") as file:
                transcription = self.client.audio.transcriptions.create(
                    file=(file_path, file.read()),
                    model="whisper-large-v3",
                    response_format="text"
                )
            return transcription
        except Exception as e:
            print(f"Groq Whisper failed: {e}")
            raise e
