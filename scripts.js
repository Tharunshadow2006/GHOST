let apiKey = "";
let selectedModel = "";
let temperature = 0.2;
let maxTokens = 256;
let selectedFile = null;

// Document Reader (RAG) support: store extractedDocText globally
window.extractedDocText = "";

// Load settings from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
  // Set initial values from localStorage
  apiKey = localStorage.getItem("apiKey") || "";
  selectedModel = localStorage.getItem("selectedModel") || "llama3-8b-8192";
  temperature = parseFloat(localStorage.getItem("temperature")) || 0.2;
  maxTokens = parseInt(localStorage.getItem("maxTokens")) || 256;

  // Set form values if elements exist
  const apiKeyInput = document.getElementById("api-key-input");
  if (apiKeyInput) apiKeyInput.value = apiKey;
  const modelSelect = document.getElementById("model-select");
  if (modelSelect) modelSelect.value = selectedModel;
  const tempInput = document.getElementById("param-temperature");
  if (tempInput) tempInput.value = temperature;
  const maxTokensInput = document.getElementById("param-max-tokens");
  if (maxTokensInput) maxTokensInput.value = maxTokens;

  // Show masked API key (for privacy)
  const maskedKey = apiKey ? apiKey.replace(/.(?=.{4})/g, "*") : "Not set";
  const sidebarApiKey = document.getElementById("sidebar-api-key");
  if (sidebarApiKey) sidebarApiKey.textContent = maskedKey;
  const sidebarModel = document.getElementById("sidebar-model");
  if (sidebarModel) sidebarModel.textContent = selectedModel || "Not selected";
  const sidebarTemp = document.getElementById("sidebar-temperature");
  if (sidebarTemp) sidebarTemp.textContent = temperature;
  const sidebarMax = document.getElementById("sidebar-max-tokens");
  if (sidebarMax) sidebarMax.textContent = maxTokens;

  // Load chat history and colors
  loadChatHistory();
  const userColor = localStorage.getItem("userTextColor") || "#065f46";
  const botColor = localStorage.getItem("botTextColor") || "#ffffff";
  if (document.getElementById("user-text-color")) {
    document.getElementById("user-text-color").value = userColor;
    document.getElementById("bot-text-color").value = botColor;
  }
  document.documentElement.style.setProperty('--user-text-color', userColor);
  document.documentElement.style.setProperty('--bot-text-color', botColor);

  // Clear chat on page load
  document.getElementById('chat-box').innerHTML = '<div class="ghost-message">Hi! I am <strong>GHOST</strong>. How can I help you?</div>';
  localStorage.removeItem("chatHistory");

  // Enter key handler for sending message
  const userInputField = document.getElementById("user-input");
  if (userInputField) {
    userInputField.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Send button handler
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // Settings button handler
  const settingsBtn = document.getElementById('settings-btn');
  const paramSettings = document.getElementById('parameter-settings');
  if (settingsBtn && paramSettings) {
    settingsBtn.addEventListener('click', function() {
      if (paramSettings.style.display === "none" || !paramSettings.style.display) {
        paramSettings.style.display = "flex";
      } else {
        paramSettings.style.display = "none";
      }
    });
  }

  // Upload button handler
  const uploadBtn = document.getElementById('upload-btn');
  const docUpload = document.getElementById('doc-upload');
  const docStatus = document.getElementById('doc-status');
  if (uploadBtn && docUpload && docStatus) {
    uploadBtn.addEventListener('click', function() {
      const file = docUpload.files[0];
      if (!file) {
        docStatus.textContent = 'No file selected.';
        window.extractedDocText = "";
        return;
      }
      docStatus.textContent = `Loaded: ${file.name}`;
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = function(evt) {
          window.extractedDocText = evt.target.result;
          docStatus.textContent += " (Text extracted)";
          addMessage(formatDocumentContent(window.extractedDocText), "bot");
        };
        reader.readAsText(file);
      } else if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const typedarray = new Uint8Array(evt.target.result);
          pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            let textPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              textPromises.push(pdf.getPage(i).then(page => page.getTextContent()).then(tc => tc.items.map(item => item.str).join(' ')));
            }
            Promise.all(textPromises).then(pages => {
              window.extractedDocText = pages.join('\n\n');
              docStatus.textContent += " (PDF text extracted)";
              addMessage(formatDocumentContent(window.extractedDocText), "bot");
            });
          });
        };
        reader.readAsArrayBuffer(file);
      } else {
        docStatus.textContent += " (Unsupported file type)";
        window.extractedDocText = "";
      }
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Set initial mode from localStorage
    if (localStorage.getItem('ghost-theme') === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.textContent = '☀️';
    }
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('ghost-theme', isDark ? 'dark' : 'light');
    });
  }

  // Mic button handler (speech-to-text with visual feedback and auto-send)
  const micBtn = document.getElementById('mic-btn');
  const userInput = document.getElementById('user-input');
  if (micBtn && userInput && 'webkitSpeechRecognition' in window) {
    let recognition;
    micBtn.addEventListener('click', function() {
      if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = function() {
          micBtn.textContent = "🔴";
          micBtn.classList.add("recording");
        };
        recognition.onresult = function(event) {
          const transcript = event.results[0][0].transcript;
          userInput.value = transcript;
          userInput.focus();
          micBtn.textContent = "🎤";
          micBtn.classList.remove("recording");
          sendMessage(); // Auto-send after recording
        };
        recognition.onerror = function() {
          recognition.stop();
          micBtn.textContent = "🎤";
          micBtn.classList.remove("recording");
        };
        recognition.onend = function() {
          micBtn.disabled = false;
          micBtn.textContent = "🎤";
          micBtn.classList.remove("recording");
        };
      }
      micBtn.disabled = true;
      recognition.start();
    });
  } else if (micBtn) {
    micBtn.addEventListener('click', function() {
      alert('Speech recognition is not supported in this browser.');
    });
  }
});

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

  // Append extracted document text if available
  let fullPrompt = userInput;
  if (window.extractedDocText && window.extractedDocText.length > 0) {
    fullPrompt += "\n\n[Reference Document]\n" + window.extractedDocText.slice(0, 2000); // Limit to 2000 chars
  }

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
        messages: [{ role: "user", content: fullPrompt }],
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
        responseText = "API Error: Invalid API Key. Please enter the GROQ API KEY.";
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

// Format document content for chat (neat, readable, but not changing UI colors or layout)
function formatDocumentContent(text) {
  if (!text) return "";
  // Limit preview to 2000 characters, preserve paragraphs, and use bold for the first line
  let lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length === 0) return "";
  let firstLine = `<strong>${escapeHtml(lines[0])}</strong>`;
  let rest = lines.slice(1).map(l => `<span>${escapeHtml(l)}</span>`).join("<br><br>");
  let preview = [firstLine, rest].join("<br><br>");
  // Limit to 2000 chars for safety
  if (preview.length > 2000) preview = preview.slice(0, 2000) + "...";
  return `<div style="margin: 18px 0; font-size: 1.13rem; line-height: 1.7; letter-spacing: 0.01em;">
    ${preview}
  </div>`;
}

// Utility to escape HTML for safe display in chat
function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}
