# GHOST Chatbot

GHOST is a modern web-based chatbot UI that connects to the GROQ API and supports Llama and Gemma models. It features a sleek interface, persistent chat history, customizable parameters, and voice input.

## Features

- **Chat with Llama 3 and Gemma models** via GROQ API
- **API key and model selection** in sidebar
- **Adjust temperature and max tokens** for responses
- **Persistent chat history** (saved in browser)
- **Customizable user and bot colors**
- **Voice input** (speech-to-text) support
- **Responsive design** for desktop and mobile

## Getting Started

1. **Clone or download this repository.**
2. Open `chatbot.html` in your browser.

> **No build step or server required.**  
> All files are static and run locally in your browser.

## Usage

1. Enter your GROQ API key in the sidebar and select a model.
2. (Optional) Adjust temperature and max tokens in settings.
3. Type your message or use the microphone button for voice input.
4. View and continue your conversation in the chat window.
## File Structure

- [`chatbot.html`](chatbot.html) — Main HTML file and UI
- [`scripts.js`](scripts.js) — JavaScript logic for chat, API, and settings
- [`style.css`](style.css) — Custom styles

## Customization

- **Colors:** Change user/bot text colors in the sidebar settings.
- **Models:** Add more models in the `<select>` dropdown in `chatbot.html`.

## Requirements

- Modern web browser (Chrome, Edge, Firefox, Safari)
- GROQ API key ([get one here](https://console.groq.com/))

## License

MIT License

---

*Made with ❤️ for modern AI chat experiences.*
