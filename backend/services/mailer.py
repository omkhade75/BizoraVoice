"""
Supplier Email & Voice Note Dispatcher Service.
Generates personalized emails and 100% self-hosted audio voice notes in selected Asian/Indic languages.
"""

from datetime import datetime, timezone
from email.mime.audio import MIMEAudio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import os
import smtplib
from typing import Dict, Optional
import uuid

import numpy as np
import soundfile as sf

from config import get_settings
from engines.registry import llm_engine, tts_engine

logger = logging.getLogger(__name__)
settings = get_settings()

STORAGE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "storage", "voicenotes")
)
os.makedirs(STORAGE_DIR, exist_ok=True)

# Language-specific voice mapping
LANGUAGE_CONFIG = {
    "mr": {
        "name": "Marathi (मराठी)",
        "voice": "mr-IN-AarohiNeural",
        "greeting": "सस्नेह नमस्कार {name} जी,",
        "subject_prefix": "मालाची चौकशी व व्हॉईस नोट (Enquiry & Voice Note)",
    },
    "hi": {
        "name": "Hindi (हिन्दी)",
        "voice": "hi-IN-SwaraNeural",
        "greeting": "नमस्ते {name} जी,",
        "subject_prefix": "सामग्री पूछताछ और वॉइस नोट (Material Enquiry & Voice Note)",
    },
    "gu": {
        "name": "Gujarati (ગુજરાતી)",
        "voice": "gu-IN-DhwaniNeural",
        "greeting": "નમસ્તે {name} ભાઈ,",
        "subject_prefix": "માલ પૂછપરછ અને વૉઇસ નોટ (Goods Enquiry & Voice Note)",
    },
    "ta": {
        "name": "Tamil (தமிழ்)",
        "voice": "ta-IN-PallaviNeural",
        "greeting": "வணக்கம் {name} அவர்களே,",
        "subject_prefix": "பொருட்கள் விசாரணை மற்றும் குரல் குறிப்பு (Goods Enquiry & Voice Note)",
    },
    "en": {
        "name": "English",
        "voice": "af_heart",
        "greeting": "Dear {name},",
        "subject_prefix": "Purchase Order Enquiry & Voice Note",
    },
}


class SupplierOutreachService:
    """Handles generating translated emails and attaching self-hosted audio voice notes."""

    @staticmethod
    async def generate_message_content(
        supplier_name: str,
        items_description: str,
        language: str = "mr",
    ) -> Dict[str, str]:
        """Generate email text and speech script in the target language using local LLM."""
        lang_info = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["mr"])
        lang_name = lang_info["name"]

        prompt = (
            f"You are Bizora AI creating an order enquiry for a supplier named {supplier_name}.\n"
            f"The enquiry is about: '{items_description}'.\n"
            f"Target Language: {lang_name}.\n"
            f"Generate two things formatted EXACTLY as:\n"
            f"[EMAIL_BODY]: A polite, professional email in {lang_name} mentioning that a voice note is attached below with details.\n"
            f"[VOICE_NOTE_SCRIPT]: A short, warm, natural spoken message in {lang_name} (2-3 sentences max) "
            f"greeting {supplier_name}, asking for stock availability, price quote, and delivery timeline."
        )

        try:
            raw_response = await llm_engine.chat(
                messages=[{"role": "user", "content": prompt}],
                system_prompt="You are an expert bilingual Indian business communication assistant.",
            )

            email_body = ""
            voice_script = ""

            if "[EMAIL_BODY]:" in raw_response and "[VOICE_NOTE_SCRIPT]:" in raw_response:
                parts = raw_response.split("[VOICE_NOTE_SCRIPT]:")
                email_body = parts[0].replace("[EMAIL_BODY]:", "").strip()
                voice_script = parts[1].strip()
            else:
                email_body = raw_response
                voice_script = f"नमस्कार {supplier_name} जी, आम्ही बिझोरा एआय कडून बोलत आहोत. आम्हाला {items_description} ची गरज आहे. कृपया उपलब्धता सांगावी."

            return {
                "email_body": email_body,
                "voice_script": voice_script,
                "language_name": lang_name,
            }
        except Exception as e:
            logger.error(f"Error generating message content: {e}")
            return {
                "email_body": f"सस्नेह नमस्कार {supplier_name} जी,\n\nआम्हाला {items_description} या मालाची आवश्यकता आहे. कृपया सोबत जोडलेली व्हॉईस नोट ऐकावी.",
                "voice_script": f"नमस्कार {supplier_name} जी, कृपया {items_description} ची उपलब्धता व दर कळवावेत.",
                "language_name": lang_name,
            }

    @staticmethod
    def create_voicenote_audio_file(
        script: str, voice: str
    ) -> tuple[str, str]:
        """
        Synthesize audio using local/self-hosted TTS and save as a standard .wav audio file.
        Returns: (file_path, public_filename)
        """
        filename = f"voicenote_{uuid.uuid4().hex[:12]}.wav"
        file_path = os.path.join(STORAGE_DIR, filename)

        # Synthesize raw PCM 16-bit 24kHz audio
        pcm_bytes = tts_engine.synthesize(script, voice=voice)

        # Convert raw PCM int16 to wav file on disk
        int16_data = np.frombuffer(pcm_bytes, dtype=np.int16)
        sf.write(file_path, int16_data, 24000, subtype="PCM_16")

        logger.info(f"Saved self-hosted voice note: {file_path} ({len(pcm_bytes)} bytes)")
        return file_path, filename

    @classmethod
    async def dispatch_enquiry(
        cls,
        supplier_email: str,
        supplier_name: str,
        items_description: str,
        language: str = "mr",
        custom_voice_script: Optional[str] = None,
        smtp_host: Optional[str] = None,
        smtp_port: int = 587,
        smtp_user: Optional[str] = None,
        smtp_password: Optional[str] = None,
    ) -> Dict[str, any]:
        """End-to-end: generates language content, synthesizes voice note, and creates/sends email."""
        lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["mr"])
        voice = lang_config["voice"]

        # 1. Generate text in target language
        content = await cls.generate_message_content(
            supplier_name, items_description, language
        )
        voice_script = custom_voice_script or content["voice_script"]
        email_body = content["email_body"]

        # 2. Synthesize audio file locally (No external cloud APIs)
        audio_path, audio_filename = cls.create_voicenote_audio_file(voice_script, voice)

        # 3. Construct MIME Email
        msg = MIMEMultipart()
        msg["From"] = smtp_user or "bizora-ai@company.internal"
        msg["To"] = supplier_email
        msg["Subject"] = f"{lang_config['subject_prefix']} - {supplier_name}"

        # HTML formatted email body with player notice
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <div style="background-color: #0f172a; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px;">Bizora AI • Supplier Communication</h2>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">Language: {lang_config['name']}</p>
                </div>
                
                <div style="padding: 20px; background-color: #ffffff;">
                    <p style="white-space: pre-wrap; font-size: 14px;">{email_body}</p>
                    
                    <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 4px;">
                        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">🎙️ Voice Note Transcription / ऑडिओ संदेश:</h4>
                        <p style="margin: 0; font-style: italic; color: #475569; font-size: 13px;">"{voice_script}"</p>
                    </div>

                    <p style="font-size: 12px; color: #64748b;">
                        📎 A voice note file (<strong>{audio_filename}</strong>) is attached to this email. You can play it directly on your phone or computer.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
                    Generated automatically by BizVoice for Bizora AI • 100% Self-Hosted
                </div>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # 4. Attach Audio Voice Note (.wav)
        with open(audio_path, "rb") as f:
            audio_attachment = MIMEAudio(f.read(), _subtype="wav")
            audio_attachment.add_header(
                "Content-Disposition", f"attachment; filename={audio_filename}"
            )
            msg.attach(audio_attachment)

        # 5. Send via SMTP if configured, else save as preview artifact
        email_sent = False
        smtp_error = None

        if smtp_host and smtp_user and smtp_password:
            try:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
                server.quit()
                email_sent = True
                logger.info(f"Email sent successfully to {supplier_email}")
            except Exception as e:
                smtp_error = str(e)
                logger.error(f"Failed to deliver email via SMTP: {e}")
        else:
            smtp_error = "SMTP credentials not provided; email prepared and voice note generated locally."

        return {
            "status": "ready",
            "email_sent": email_sent,
            "smtp_message": smtp_error,
            "supplier_email": supplier_email,
            "supplier_name": supplier_name,
            "language": language,
            "language_name": lang_config["name"],
            "voice_used": voice,
            "email_body": email_body,
            "voice_script": voice_script,
            "audio_file": audio_filename,
            "audio_path": audio_path,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
