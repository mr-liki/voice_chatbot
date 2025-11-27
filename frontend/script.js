// Load voices on page load
window.speechSynthesis.onvoiceschanged = () => {};

const voiceBtn = document.getElementById('voice-btn');
const chatBox = document.getElementById('chat-box');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const chatContainer = document.getElementById('chat-container');
const warningBox = document.getElementById('warning-box'); // 🔔 Added warning box reference
let chatStarted = false;

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'en-GB';
recognition.interimResults = true;
recognition.maxAlternatives = 3;

let tempUserBubble = null;

// 🎯 Start Chat Session with Smooth Animation
startBtn.addEventListener('click', () => {
  chatStarted = true;

  startScreen.style.opacity = "0";
  startScreen.style.transition = "opacity 0.8s ease";

  setTimeout(() => {
    startScreen.style.display = "none";

    chatContainer.style.display = "block";
    chatContainer.style.opacity = "0";
    chatContainer.style.transition = "opacity 0.8s ease";
    setTimeout(() => {
      chatContainer.style.opacity = "1";
    }, 50);

    const welcomeText = "Hey, I'm Leo the voice bot. How can I help you?";
    addMessage(welcomeText, 'bot');
    speakText(welcomeText);

  }, 800);
});

// 🎤 Voice Listening Button
voiceBtn.addEventListener('click', () => {
  if (!chatStarted) return;
  recognition.start();
});

// UI Feedback
recognition.onstart = () => {
  voiceBtn.innerText = "Listening...";
};

recognition.onend = () => {
  voiceBtn.innerText = "Tap to Speak";
};

// 🚨 Custom Animated Warning Function (Fixed animation)
function showWarning(message) {
  if (!warningBox) {
    console.warn("Warning box not found in DOM:", message);
    return;
  }

  warningBox.textContent = message;
  // Ensure correct classes
  warningBox.classList.remove("hide");
  // Force reflow to reset animation if needed
  // eslint-disable-next-line no-unused-expressions
  warningBox.offsetHeight;
  warningBox.classList.add("show");

  setTimeout(() => {
    warningBox.classList.remove("show");
    warningBox.classList.add("hide");
  }, 2200); // Stays visible before disappearing
}

// 🛑 Handle speech recognition failure
recognition.onerror = () => {
  showWarning("Failed to recognize, please say clearly and loudly");
  voiceBtn.innerText = "Tap to Speak";
};

// 📝 Live Transcription & Final Response
recognition.onresult = async (event) => {
  let interimText = '';
  let finalText = '';

  for (let i = 0; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalText += transcript;
    } else {
      interimText += transcript;
    }
  }

  if (!tempUserBubble) {
    tempUserBubble = document.createElement('div');
    tempUserBubble.classList.add('message', 'user');
    chatBox.appendChild(tempUserBubble);
  }

  tempUserBubble.textContent = interimText || finalText;
  chatBox.scrollTop = chatBox.scrollHeight;

  if (finalText) {
    if (finalText.trim() === "") {
      showWarning("Failed to recognize, please say clearly and loudly");
      tempUserBubble.remove();
      tempUserBubble = null;
      return;
    }

    tempUserBubble.textContent = finalText;
    tempUserBubble = null;

    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalText })
    });

    const data = await response.json();
    const botMessage = data.response;
    addMessage(botMessage, 'bot');
    speakText(botMessage);
  }
};

// 🧾 Display Message in Chat UI
function addMessage(message, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);

  // Fade-in effect for new messages
  msgDiv.style.opacity = "0";
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);

  setTimeout(() => {
    msgDiv.style.transition = "opacity 0.6s ease";
    msgDiv.style.opacity = "1";
  }, 50);

  chatBox.scrollTop = chatBox.scrollHeight;
}

function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.pitch = 1;
  speech.rate = 1;
  speech.volume = 1;

  // Disable Tap to Speak button while bot is speaking
  voiceBtn.disabled = true;
  voiceBtn.innerText = "⏳ Bot is speaking...";

  // Re-enable after speech ends
  speech.onend = () => {
    voiceBtn.disabled = false;
    voiceBtn.innerText = "Tap to Speak";
  };

  window.speechSynthesis.speak(speech);
}
