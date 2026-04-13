# 🧠 AI-Based DeepFake Speech Generator (DFSG)

This project is a **DeepFake Speech Generation** system that takes user input text and either:
- Synthesizes audio using a pretrained **Tacotron2-DDC** voice, or
- Clones the user’s voice from a short `.wav` sample using **YourTTS**.

The system also provides a **mel-spectrogram visualization** for analysis, useful in both **generation quality** and **deepfake detection** research.

---

## Features

- **Text-to-Speech (TTS)** using [Coqui TTS](https://github.com/coqui-ai/TTS)
- **Voice cloning** using multilingual `YourTTS`
-Streamlit interface for real-time interaction
- Mel-spectrogram display using Librosa + Matplotlib

---

## Important Notes on Deployment

### Streamlit Cloud 
> Due to system limitations, **Coqui TTS (TTS)** cannot be installed on Streamlit Cloud.

You can still deploy and show the interface **without TTS functionality**. The app will load but audio generation won’t work unless run locally or on GPU-enabled environments.

---

## Run Locally (Recommended for Full Functionality)

### 1. Create virtual environment

```bash
python -m venv tts-env
source tts-env/bin/activate  # Windows: tts-env\Scripts\activate


**2. Install dependencies**

pip install -U pip setuptools wheel  
pip install TTS==0.10.3  
pip install torch==1.12.1 torchaudio==0.12.1  
pip install streamlit librosa==0.9.2 matplotlib numpy Pillow

**3. Run the app**

streamlit run DFSG.py
