import speech_recognition as sr
import requests
from gtts import gTTS
import pygame
import time
import os
import uuid

FASTAPI_URL = "http://127.0.0.1:8000/chat"   # Your FastAPI endpoint

recognizer = sr.Recognizer()

def speech_to_text():
    """Capture audio from microphone and convert to text."""
    try:
        # Auto-select working microphone
        with sr.Microphone() as source:
            print("\n🎤 Speak clearly...")
            
            # Adjust for ambient noise
            recognizer.energy_threshold = 300
            recognizer.dynamic_energy_threshold = True
            recognizer.adjust_for_ambient_noise(source, duration=1)
            print(f"Ambient Noise Level: {recognizer.energy_threshold}")
            
            # Listen to the user
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=7)

        print("🎙 Recognizing...")
        text = recognizer.recognize_google(audio)
        print(f"🗣 You said: {text}")
        return text

    except sr.WaitTimeoutError:
        print("⌛ You didn't speak. Try again.")
        return None
    except sr.UnknownValueError:
        print("❌ Could not understand. Speak clearly.")
        return None
    except sr.RequestError as e:
        print(f"⚠️ Network error: {e}")
        return None


def chatbot_response(text):
    """Send user text to chatbot API and get response."""
    try:
        response = requests.post(
            FASTAPI_URL,
            json={"message": text}
        )
        return response.json().get("response", "No response from chatbot.")
    except Exception as e:
        return f"Error contacting chatbot: {str(e)}"


def text_to_speech(text):
    """Convert bot response text to speech and play it."""
    # Use unique filename to avoid permission issues
    filename = f"response_{uuid.uuid4().hex}.mp3"
    
    # Generate TTS
    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(filename)

    # Initialize mixer if not already
    if not pygame.mixer.get_init():
        pygame.mixer.init()

    # Play audio
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()

    # Wait until audio finishes
    while pygame.mixer.music.get_busy():
        time.sleep(0.1)

    # Clean up audio file
    try:
        os.remove(filename)
    except:
        pass


def main():
    """Main loop: continuously listen, send to chatbot, speak response."""
    print("\n🤖 Voice Chatbot Ready! Say 'exit' to quit.")

    while True:
        user_input = speech_to_text()

        if not user_input:
            continue  # Retry until voice captured

        if user_input.lower() == "exit":
            print("👋 Goodbye!")
            break

        bot_reply = chatbot_response(user_input)
        print(f"🤖 Bot: {bot_reply}")

        # Short pause before speaking to avoid overlap
        time.sleep(0.3)
        text_to_speech(bot_reply)


if __name__ == "__main__":
    main()
