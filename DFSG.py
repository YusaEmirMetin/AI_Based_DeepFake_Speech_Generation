import streamlit as st
from TTS.api import TTS
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import os

# Load and display image
image = Image.open("image.png")
st.image(image, use_container_width=True)

# UI Title
st.title("🎙️ Deepfake Speech Generator")
st.markdown("Generate speech via **Tacotron2-DDC** or clone from your own upload.")

# Text input
text_input = st.text_area("Enter Text:", "Hi, I am an AI model here to assist you. I was developed by Yusa Emir Metin.")

# Upload speaker sample (optional)
st.markdown("**Optional:** upload a WAV to clone your own Speech")
speaker_sample = st.file_uploader("Upload a WAV file", type=["wav"])

# Output path
output_path = "output.wav"

# Default TTS
if st.button("🧠 Default Speech"):
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)
    tts.tts_to_file(text=text_input, file_path=output_path)
    st.audio(output_path)
    st.success("Default Speech generated!")

# Clone Speech
if st.button("🧬 Clone Speech"):
    if speaker_sample is not None:
        temp_wav_path = "temp.wav"
        with open(temp_wav_path, "wb") as f:
            f.write(speaker_sample.read())
        
        try:
            tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts", progress_bar=False, gpu=False)
            tts.tts_to_file(text=text_input, speaker_wav=temp_wav_path, language="en", file_path=output_path)
            st.audio(output_path)
            st.success("Cloned Speech generated!")
        except Exception as e:
            st.error(f"Error cloning Speech: {e}")
    else:
        st.warning("Please upload a WAV file to clone your Speech.")

# Show spectrogram
if st.button("📈 Play & Show Spectrogram"):
    if os.path.exists(output_path):
        y, sr = librosa.load(output_path, sr=None)
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=80, fmax=8000)
        S_dB = librosa.power_to_db(S, ref=np.max)
        fig, ax = plt.subplots(figsize=(10, 4))
        img = librosa.display.specshow(S_dB, sr=sr, x_axis='time', y_axis='mel', fmax=8000, cmap='viridis', ax=ax)
        fig.colorbar(img, ax=ax, format='%+2.0f dB')
        ax.set(title="Mel-Spectrogram of Generated Speech")
        st.pyplot(fig)
    else:
        st.warning("No output.wav file to analyze.")
