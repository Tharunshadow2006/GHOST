let apiKey = "";
let selectedModel = "";
let temperature = 0.2;
let maxTokens = 256;

// Load settings from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
  apiKey = localStorage.getItem("apiKey") || "";
  selectedModel = localStorage.getItem("selectedModel") || "llama3-8b-8192";
  temperature = parseFloat(localStorage.getItem("temperature")) || 0.2;
  maxTokens = parseInt(localStorage.getItem("maxTokens")) || 256;

  document.getElementById("api-key-input").value = apiKey;
  document.getElementById("model-select").value = selectedModel;
  document.getElementById("param-temperature").value = temperature;
  document.getElementById("param-max-tokens").value = maxTokens;

  // Show masked API key (for privacy)
  const maskedKey = apiKey ? apiKey.replace(/.(?=.{4})/g, "*") : "Not set";
  document.getElementById("sidebar-api-key").textContent = maskedKey;
  document.getElementById("sidebar-model").textContent = selectedModel || "Not selected";
  document.getElementById("sidebar-temperature").textContent = temperature;
  document.getElementById("sidebar-max-tokens").textContent = maxTokens;

  loadChatHistory();
});

window.onload = function() {
  // Apply saved colors
  const userColor = localStorage.getItem("userTextColor") || "#065f46";
  const botColor = localStorage.getItem("botTextColor") || "#ffffff";
  document.getElementById("user-text-color").value = userColor;
  document.getElementById("bot-text-color").value = botColor;
  document.documentElement.style.setProperty('--user-text-color', userColor);
  document.documentElement.style.setProperty('--bot-text-color', botColor);

  // Clear chat on page load
  document.getElementById('chat-box').innerHTML = '<div class="ghost-message">Hi! I am <strong>GHOST</strong>. How can I help you?</div>';
};

function saveSettings() {
  apiKey = document.getElementById("api-key-input").value.trim();
  selectedModel = document.getElementById("model-select").value;
  temperature = parseFloat(document.getElementById("param-temperature").value) || 0.2;
  maxTokens = parseInt(document.getElementById("param-max-tokens").value) || 256;

  // Save to localStorage
  localStorage.setItem("apiKey", apiKey);
  localStorage.setItem("selectedModel", selectedModel);
  localStorage.setItem("temperature", temperature);
  localStorage.setItem("maxTokens", maxTokens);

  const userColor = document.getElementById("user-text-color").value;
  const botColor = document.getElementById("bot-text-color").value;
  localStorage.setItem("userTextColor", userColor);
  localStorage.setItem("botTextColor", botColor);

  document.documentElement.style.setProperty('--user-text-color', userColor);
  document.documentElement.style.setProperty('--bot-text-color', botColor);

  // Show masked API key (for privacy)
  const maskedKey = apiKey ? apiKey.replace(/.(?=.{4})/g, "*") : "Not set";
  document.getElementById("sidebar-api-key").textContent = maskedKey;
  document.getElementById("sidebar-model").textContent = selectedModel || "Not selected";
  document.getElementById("sidebar-temperature").textContent = temperature;
  document.getElementById("sidebar-max-tokens").textContent = maxTokens;

  alert("Settings saved!");
}

async function sendMessage() {
  const inputField = document.getElementById("user-input");
  const userInput = inputField.value.trim();
  if (!userInput) return;

  addMessage(userInput, "user");

  if (!apiKey) {
    setTimeout(() => addMessage("Please enter your API key and save settings.", "bot"), 500);
    return;
  }

  // Show "thinking" message
  const thinkingMsg = addMessage("Thinking...", "bot");

  try {
    let responseText = "";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: userInput }],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });
    const data = await response.json();
    if (data.error) {
      if (
        data.error.message &&
        data.error.message.toLowerCase().includes("invalid api key")
      ) {
        responseText = "API Error: Invalid API Key.Please enter the GROQ API KEY.";
      } else {
        responseText = "API Error: " + (data.error.message || JSON.stringify(data.error));
      }
    } else {
      responseText = data.choices?.[0]?.message?.content || "No response from API.";
    }
    thinkingMsg.textContent = responseText;
  } catch (err) {
    thinkingMsg.textContent = "Error: " + err.message;
  }

  inputField.value = "";
}

function addMessage(message, sender) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  if (sender === "user") {
    messageElement.className = "user-message";
  } else if (sender === "bot" || sender === "ghost") {
    messageElement.className = "ghost-message";
  }
  messageElement.innerHTML = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveChatHistory(); // <-- Add this line
  return messageElement;
}

function saveChatHistory() {
  const chatBox = document.getElementById("chat-box");
  const messages = [];
  chatBox.querySelectorAll('.user-message, .bot-message, .ghost-message').forEach(msg => {
    messages.push({
      html: msg.outerHTML
    });
  });
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

function loadChatHistory() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  const messages = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  messages.forEach(msg => {
    chatBox.insertAdjacentHTML("beforeend", msg.html);
  });
}

document.getElementById('clear-chat-btn').onclick = function() {
  sessionStorage.removeItem("chatHistory");
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = '<div class="ghost-message">Hi! I am <strong>GHOST</strong>. How can I help you?</div>';
};
