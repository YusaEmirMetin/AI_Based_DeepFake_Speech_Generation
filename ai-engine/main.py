from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import sys
from TTS.api import TTS

app = FastAPI(title="DFSG AI Engine", description="Microservice for DeepFake Speech Generation using XTTSv2")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agree to terms for XTTSv2 automatically
os.environ["COQUI_TOS_AGREED"] = "1"

# Initialize XTTSv2 Model
# Note: The first time this runs, it will download the model files (~2GB)
try:
    print("Loading XTTSv2 Model...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
except Exception as e:
    print(f"Error loading model: {e}")
    tts = None

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": tts is not None}

@app.post("/generate/default")
async def generate_default(text: str = Form(...), language: str = Form("en")):
    if not tts:
        raise HTTPException(status_code=500, detail="Model is not loaded")
        
    output_filename = f"out_default_{uuid.uuid4().hex}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        # XTTSv2 requires a speaker wav for reference. If not provided, we need to use a dummy or skip zero-shot.
        # But wait, XTTSv2 *mandates* a speaker_wav. If calling default, we might fallback to standard TTS or provide a default sample.
        # Let's use a default sample if it exists, otherwise raise an error to upload one.
        raise HTTPException(status_code=400, detail="XTTSv2 strictly requires a reference speaker_wav. Use /generate/clone endpoint instead.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/clone")
async def generate_clone(
    text: str = Form(...), 
    language: str = Form("en"),
    speaker_wav: UploadFile = File(...)
):
    if not tts:
        raise HTTPException(status_code=500, detail="Model is not loaded")
        
    temp_wav_path = os.path.join(UPLOAD_DIR, f"ref_{uuid.uuid4().hex}.wav")
    with open(temp_wav_path, "wb") as f:
        f.write(speaker_wav.file.read())
        
    output_filename = f"out_clone_{uuid.uuid4().hex}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        # Generate cloned speech
        tts.tts_to_file(
            text=text,
            speaker_wav=temp_wav_path,
            language=language,
            file_path=output_path
        )
        return FileResponse(output_path, media_type="audio/wav", filename=output_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp reference file
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
