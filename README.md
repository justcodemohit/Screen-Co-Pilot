Screen Copilot AI
A Chrome extension that opens a small floating, always-on-top chat window and lets you ask live questions — by text or voice — about whatever is on your screen. Built with the Document Picture-in-Picture API, so the window stays visible over any other app while you work.

**Features:
Floating, always-on-top window — stays visible over VS Code, PDF readers, Zoom, or anything else, powered by the Document Picture-in-Picture API
Real chat interface — scrolling message thread with conversation memory, not a one-shot Q&A box
Live screen capture — grabs a fresh screenshot of whatever you're sharing with every question
Preview auto-matches your real screen ratio — no distortion regardless of monitor shape
Multi-provider support — works with Anthropic Claude, OpenAI GPT, or Google Gemini; switch anytime, each key stored separately
File & image upload — attach a screenshot, PDF, or text/code file alongside your question
Voice input — speak your question via the browser's built-in speech recognition
Voice output — optional read-aloud of answers via the browser's built-in text-to-speech (fully local)
**Tech stack
Vanilla JavaScript, HTML, CSS — no build step, no framework
Chrome Extension Manifest V3
Document Picture-in-Picture API
getDisplayMedia for screen capture
Web Speech API (SpeechRecognition + SpeechSynthesis) for voice
Direct client-side calls to the Anthropic Messages API, OpenAI Responses API, and Google Gemini API
**Installation
Clone or download this repo
Open Chrome (or another Chromium browser) and go to chrome://extensions
Turn on Developer mode (top-right toggle)
Click Load unpacked and select this project's folder
Pin the extension icon from the puzzle-piece menu in your toolbar
