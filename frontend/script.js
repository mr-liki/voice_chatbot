// Load voices on page load
window.speechSynthesis.onvoiceschanged = () => {};

const voiceBtn = document.getElementById('voice-btn');
const chatBox = document.getElementById('chat-box');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const chatContainer = document.getElementById('chat-container');
const warningBox = document.getElementById('warning-box');
let chatStarted = false;

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'en-GB';
recognition.interimResults = true;
recognition.maxAlternatives = 3;
recognition.continuous = false;

let tempUserBubble = null;
let recognitionTimeout = null;
let isFirstRequest = true; // 🔹 Added this flag

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

  recognitionTimeout = setTimeout(() => {
    recognition.stop();
  }, 8000);
});

// UI Feedback
recognition.onstart = () => {
  voiceBtn.innerText = "Listening...";
};

// 🛑 Smart auto-stop when user finishes speaking
recognition.onspeechend = () => {
  recognition.stop();
};

recognition.onend = () => {
  voiceBtn.innerText = "Tap to Speak";
  clearTimeout(recognitionTimeout);
};

// 🚨 Custom Animated Warning Function
function showWarning(message) {
  if (!warningBox) return;

  warningBox.textContent = message;
  warningBox.classList.remove("hide");
  warningBox.offsetHeight;
  warningBox.classList.add("show");

  setTimeout(() => {
    warningBox.classList.remove("show");
    warningBox.classList.add("hide");
  }, 2200);
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

    // 🔹 First request handling - show waking animation
    if (isFirstRequest) {
      voiceBtn.disabled = true;
      voiceBtn.innerHTML = `<span class="loader"></span> Waking up...`;
    }

    const response = await fetch("https://voice-chatbot-269z.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalText })
    });

    const data = await response.json();
    const botMessage = data.response;
    addMessage(botMessage, 'bot');

    // 🔹 After first response, reset for normal behavior
    if (isFirstRequest) {
      isFirstRequest = false;
    }

    speakText(botMessage);
  }
};

// 🧾 Display Message in Chat UI
function addMessage(message, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);

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

  voiceBtn.disabled = true;
  voiceBtn.innerText = "⏳ Bot is speaking...";

  speech.onend = () => {
    voiceBtn.disabled = false;
    voiceBtn.innerText = "Tap to Speak";
  };

  window.speechSynthesis.speak(speech);
}
