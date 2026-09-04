const startBtn = document.getElementById("startBtn");
const statusMsg = document.getElementById("statusMsg");
const sourceVideo = document.getElementById("sourceVideo");

let mediaStream = null;

function setStatus(text, isError = false) {
  statusMsg.textContent = text;
  statusMsg.classList.toggle("err", isError);
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  setStatus("Requesting screen access…");

  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 5 },
      audio: false,
    });
  } catch (err) {
    setStatus("Screen share was cancelled or blocked.", true);
    startBtn.disabled = false;
    return;
  }

  sourceVideo.srcObject = mediaStream;
  await sourceVideo.play();

  mediaStream.getVideoTracks()[0].addEventListener("ended", () => {
    setStatus("Screen sharing stopped.", true);
    startBtn.disabled = false;
  });

  setStatus("Watching your screen ✓ — opening floating window…");
  openFloatingCopilot();
});

async function openFloatingCopilot() {
  if (!("documentPictureInPicture" in window)) {
    setStatus(
      "Your browser doesn't support the floating Picture-in-Picture window. Update Chrome to the latest version.",
      true
    );
    return;
  }

  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: 400,
    height: 600,
  });

  pipWindow.document.title = "Screen Copilot";
  pipWindow.document.body.innerHTML = getFloatingUIHtml();
  pipWindow.document.body.style.margin = "0";
  pipWindow.document.body.style.background = "#0f1115";
  pipWindow.document.body.style.color = "#f1f1f4";
  pipWindow.document.body.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  wireFloatingUI(pipWindow);

  setStatus(
    "Floating Copilot is live. You can switch to other apps — keep this tab open in the background."
  );

  pipWindow.addEventListener("pagehide", () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
  });
}

function getFloatingUIHtml() {
  return `
    <style>
      #chatLog::-webkit-scrollbar { width: 6px; }
      #chatLog::-webkit-scrollbar-thumb { background: #2a2c35; border-radius: 3px; }
      .bubble {
        max-width: 82%;
        padding: 9px 12px;
        border-radius: 14px;
        font-size: 13px;
        line-height: 1.45;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin-bottom: 8px;
      }
      .bubble.user {
        background: linear-gradient(135deg,#6366f1,#8b5cf6);
        color: white;
        margin-left: auto;
        border-bottom-right-radius: 4px;
      }
      .bubble.assistant {
        background: #1a1c23;
        border: 1px solid #23252d;
        color: #e4e4e9;
        margin-right: auto;
        border-bottom-left-radius: 4px;
      }
      .bubble.assistant.loading { color: #86868f; font-style: italic; }
      .bubble.assistant.err { border-color: #f97583; color: #f97583; }
      #promptInput::placeholder { color: #6b6b74; }
      .icon-btn {
        width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%;
        border: 1px solid #2a2c35; background: #1a1c23; color: #d8d8de;
        font-size: 14px; cursor: pointer; display: flex; align-items: center;
        justify-content: center; padding: 0;
      }
      .icon-btn:hover { border-color: #6366f1; }
      .icon-btn.active { background: #ef4444; border-color: #ef4444; color: white; }
      .icon-btn.on { background: #6366f1; border-color: #6366f1; color: white; }
      #attachChip {
        display: none; align-items: center; gap: 8px; background: #1a1c23;
        border: 1px solid #2a2c35; border-radius: 10px; padding: 6px 8px;
        margin-bottom: 8px; font-size: 12px; color: #d8d8de;
      }
      #attachChip img { width: 28px; height: 28px; object-fit: cover; border-radius: 5px; }
      #attachChip .chip-remove { margin-left: auto; cursor: pointer; color: #86868f; font-size: 14px; }
      #attachChip .chip-remove:hover { color: #f97583; }
    </style>
    <div style="padding:14px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-shrink:0;">
        <div style="width:9px;height:9px;border-radius:50%;background:#6366f1;box-shadow:0 0 8px #6366f1;"></div>
        <strong style="font-size:14px;">Screen Copilot</strong>
        <span id="liveDot" style="margin-left:auto;font-size:10.5px;color:#7ee787;">● watching</span>
        <button id="voiceToggleBtn" class="icon-btn" title="Read answers aloud" style="width:26px;height:26px;font-size:12px;">🔊</button>
      </div>

      <div id="thumbWrap" style="border:1px solid #23252d;border-radius:8px;overflow:hidden;margin-bottom:10px;background:#000;width:100%;aspect-ratio:16/9;flex-shrink:0;">
        <canvas id="thumbCanvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>

      <div id="chatLog" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;padding-right:2px;margin-bottom:8px;"></div>

      <div id="attachChip">
        <span id="chipIcon">📎</span>
        <img id="chipThumb" style="display:none;" />
        <span id="chipName"></span>
        <span class="chip-remove" id="chipRemove">✕</span>
      </div>

      <div style="display:flex;gap:6px;flex-shrink:0;align-items:flex-end;">
        <input type="file" id="fileInput" accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.py,.html,.css,.log" style="display:none;" />
        <button id="attachBtn" class="icon-btn" title="Attach image or file">📎</button>
        <button id="micBtn" class="icon-btn" title="Speak your question">🎤</button>
        <textarea id="promptInput" rows="1" placeholder="Message Screen Copilot…"
          style="flex:1;resize:none;padding:9px 12px;border-radius:18px;border:1px solid #2a2c35;background:#1a1c23;color:#f1f1f4;font-size:13px;box-sizing:border-box;max-height:70px;"></textarea>
        <button id="askBtn" class="icon-btn" title="Send" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;font-size:15px;">➤</button>
      </div>
    </div>
  `;
}

function wireFloatingUI(pipWindow) {
  const doc = pipWindow.document;
  const thumbWrap = doc.getElementById("thumbWrap");
  const thumbCanvas = doc.getElementById("thumbCanvas");
  const askBtn = doc.getElementById("askBtn");
  const attachBtn = doc.getElementById("attachBtn");
  const fileInput = doc.getElementById("fileInput");
  const micBtn = doc.getElementById("micBtn");
  const voiceToggleBtn = doc.getElementById("voiceToggleBtn");
  const promptInput = doc.getElementById("promptInput");
  const chatLog = doc.getElementById("chatLog");
  const attachChip = doc.getElementById("attachChip");
  const chipThumb = doc.getElementById("chipThumb");
  const chipName = doc.getElementById("chipName");
  const chipIcon = doc.getElementById("chipIcon");
  const chipRemove = doc.getElementById("chipRemove");

  const thumbCtx = thumbCanvas.getContext("2d");

  // --- Live preview sized to the REAL aspect ratio of the shared screen ---
  function syncThumbSize() {
    const vw = sourceVideo.videoWidth;
    const vh = sourceVideo.videoHeight;
    if (vw && vh) {
      thumbWrap.style.aspectRatio = `${vw} / ${vh}`;
    }
    // Match canvas pixel buffer to the box's actual rendered size (avoids blur/stretch).
    thumbCanvas.width = thumbWrap.clientWidth || 350;
    thumbCanvas.height = thumbWrap.clientHeight || Math.round(thumbCanvas.width * 9 / 16);
  }
  syncThumbSize();
  pipWindow.addEventListener("resize", syncThumbSize);

  const previewInterval = pipWindow.setInterval(() => {
    if (sourceVideo.videoWidth) {
      thumbCtx.drawImage(sourceVideo, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }
  }, 500);
  pipWindow.addEventListener("pagehide", () => clearInterval(previewInterval));

  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 70) + "px";
  });

  const chatHistory = [];
  const MAX_HISTORY_TURNS = 8;

  function appendBubble(role, text, extraClass = "") {
    const div = doc.createElement("div");
    div.className = `bubble ${role} ${extraClass}`.trim();
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
    return div;
  }

  // --- Attachments (image / PDF / text file) ---
  let currentAttachment = null; // { kind: 'image'|'pdf'|'text', name, mimeType, base64?, textContent? }

  function clearAttachment() {
    currentAttachment = null;
    attachChip.style.display = "none";
    chipThumb.style.display = "none";
    fileInput.value = "";
  }

  function showAttachmentChip(name, previewDataUrl) {
    attachChip.style.display = "flex";
    chipName.textContent = name;
    if (previewDataUrl) {
      chipThumb.src = previewDataUrl;
      chipThumb.style.display = "block";
      chipIcon.style.display = "none";
    } else {
      chipThumb.style.display = "none";
      chipIcon.style.display = "inline";
    }
  }

  attachBtn.addEventListener("click", () => fileInput.click());
  chipRemove.addEventListener("click", clearAttachment);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const TEXT_TYPES = ["text/", "application/json"];
    const TEXT_EXT = /\.(txt|md|csv|json|js|py|html|css|log)$/i;

    if (file.type.startsWith("image/")) {
      const dataUrl = await readFileAsDataURL(file);
      currentAttachment = {
        kind: "image",
        name: file.name,
        mimeType: file.type,
        base64: dataUrl.split(",")[1],
      };
      showAttachmentChip(file.name, dataUrl);
    } else if (file.type === "application/pdf") {
      const dataUrl = await readFileAsDataURL(file);
      currentAttachment = {
        kind: "pdf",
        name: file.name,
        mimeType: "application/pdf",
        base64: dataUrl.split(",")[1],
      };
      showAttachmentChip(file.name, null);
    } else if (TEXT_TYPES.some((t) => file.type.startsWith(t)) || TEXT_EXT.test(file.name)) {
      const text = await readFileAsText(file);
      currentAttachment = { kind: "text", name: file.name, textContent: text.slice(0, 20000) };
      showAttachmentChip(file.name, null);
    } else {
      appendBubble("assistant", `⚠️ Can't read "${file.name}" — try an image, PDF, or plain text/code file.`, "err");
      fileInput.value = "";
    }
  });

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // --- Voice input (speech-to-text) ---
  const SpeechRecognitionCtor = pipWindow.SpeechRecognition || pipWindow.webkitSpeechRecognition;
  let recognizer = null;
  let listening = false;

  if (SpeechRecognitionCtor) {
    recognizer = new SpeechRecognitionCtor();
    recognizer.lang = "en-US";
    recognizer.interimResults = true;
    recognizer.continuous = false;

    recognizer.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      promptInput.value = transcript;
      promptInput.style.height = "auto";
      promptInput.style.height = Math.min(promptInput.scrollHeight, 70) + "px";
    };
    recognizer.onend = () => {
      listening = false;
      micBtn.classList.remove("active");
    };
    recognizer.onerror = () => {
      listening = false;
      micBtn.classList.remove("active");
    };
  } else {
    micBtn.title = "Voice input not supported in this browser";
    micBtn.style.opacity = "0.4";
  }

  micBtn.addEventListener("click", () => {
    if (!recognizer) return;
    if (listening) {
      recognizer.stop();
      listening = false;
      micBtn.classList.remove("active");
    } else {
      promptInput.value = "";
      recognizer.start();
      listening = true;
      micBtn.classList.add("active");
    }
  });

  // --- Voice output (text-to-speech) ---
  let voiceOutputOn = false;
  voiceToggleBtn.addEventListener("click", () => {
    voiceOutputOn = !voiceOutputOn;
    voiceToggleBtn.classList.toggle("on", voiceOutputOn);
    if (!voiceOutputOn) pipWindow.speechSynthesis.cancel();
  });

  function speak(text) {
    if (!voiceOutputOn || !pipWindow.speechSynthesis) return;
    pipWindow.speechSynthesis.cancel();
    const utter = new pipWindow.SpeechSynthesisUtterance(text);
    pipWindow.speechSynthesis.speak(utter);
  }

  // --- Sending messages ---
  const PROVIDER_STORAGE_KEYS = {
    anthropic: "anthropicApiKey",
    openai: "openaiApiKey",
    gemini: "geminiApiKey",
  };
  const PROVIDER_LABELS = { anthropic: "Anthropic", openai: "OpenAI", gemini: "Gemini" };

  async function handleAsk() {
    const question = promptInput.value.trim();
    if (!question) return;

    if (listening && recognizer) recognizer.stop();

    promptInput.value = "";
    promptInput.style.height = "auto";

    const attachmentForThisTurn = currentAttachment;
    const bubbleLabel = attachmentForThisTurn ? `${question}\n📎 ${attachmentForThisTurn.name}` : question;
    appendBubble("user", bubbleLabel);
    clearAttachment();

    const thinkingBubble = appendBubble("assistant", "Thinking…", "loading");

    const { selectedProvider } = await chrome.storage.local.get(["selectedProvider"]);
    const provider = selectedProvider || "anthropic";
    const storageKey = PROVIDER_STORAGE_KEYS[provider];
    const { [storageKey]: apiKey } = await chrome.storage.local.get([storageKey]);

    if (!apiKey) {
      thinkingBubble.textContent = `⚠️ No ${PROVIDER_LABELS[provider]} API key saved. Click the Screen Copilot extension icon, pick "${PROVIDER_LABELS[provider]}" as the provider, and paste your key.`;
      thinkingBubble.classList.remove("loading");
      thinkingBubble.classList.add("err");
      return;
    }

    const captureCanvas = doc.createElement("canvas");
    captureCanvas.width = sourceVideo.videoWidth || 1280;
    captureCanvas.height = sourceVideo.videoHeight || 720;
    captureCanvas.getContext("2d").drawImage(sourceVideo, 0, 0, captureCanvas.width, captureCanvas.height);
    const base64Screenshot = captureCanvas.toDataURL("image/jpeg", 0.75).split(",")[1];

    askBtn.disabled = true;
    const historyToSend = chatHistory.slice(-MAX_HISTORY_TURNS * 2);

    try {
      let answer;
      const args = [apiKey, base64Screenshot, question, historyToSend, attachmentForThisTurn];
      if (provider === "anthropic") answer = await askClaudeVision(...args);
      else if (provider === "openai") answer = await askOpenAIVision(...args);
      else if (provider === "gemini") answer = await askGeminiVision(...args);
      else throw new Error("Unknown provider selected.");

      thinkingBubble.textContent = answer;
      thinkingBubble.classList.remove("loading");
      chatHistory.push({ role: "user", text: question });
      chatHistory.push({ role: "assistant", text: answer });
      speak(answer);
    } catch (err) {
      thinkingBubble.textContent = "⚠️ " + err.message;
      thinkingBubble.classList.remove("loading");
      thinkingBubble.classList.add("err");
    } finally {
      askBtn.disabled = false;
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }

  askBtn.addEventListener("click", handleAsk);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  });

  promptInput.focus();
}

// Builds the extra text to prepend when a text-file attachment is present.
function buildAttachmentTextPrefix(attachment) {
  if (attachment && attachment.kind === "text") {
    return `Attached file "${attachment.name}":\n---\n${attachment.textContent}\n---\n\n`;
  }
  return "";
}

async function askClaudeVision(apiKey, base64Screenshot, question, history, attachment) {
  const messages = history.map((h) => ({ role: h.role, content: h.text }));

  const content = [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Screenshot } },
  ];
  if (attachment && attachment.kind === "image") {
    content.push({ type: "image", source: { type: "base64", media_type: attachment.mimeType, data: attachment.base64 } });
  } else if (attachment && attachment.kind === "pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: attachment.base64 } });
  }
  content.push({ type: "text", text: buildAttachmentTextPrefix(attachment) + question });
  messages.push({ role: "user", content });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1024, messages }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error (${response.status}): ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const textBlock = data.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "(No text response returned.)";
}

async function askOpenAIVision(apiKey, base64Screenshot, question, history, attachment) {
  const input = history.map((h) => ({
    role: h.role,
    content: [{ type: h.role === "user" ? "input_text" : "output_text", text: h.text }],
  }));

  const content = [
    { type: "input_text", text: buildAttachmentTextPrefix(attachment) + question },
    { type: "input_image", image_url: `data:image/jpeg;base64,${base64Screenshot}` },
  ];
  if (attachment && attachment.kind === "image") {
    content.push({ type: "input_image", image_url: `data:${attachment.mimeType};base64,${attachment.base64}` });
  } else if (attachment && attachment.kind === "pdf") {
    content.push({
      type: "input_file",
      filename: attachment.name,
      file_data: `data:application/pdf;base64,${attachment.base64}`,
    });
  }
  input.push({ role: "user", content });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-5.6", input }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  if (data.output_text) return data.output_text;
  const message = (data.output || []).find((item) => item.type === "message");
  const textPart = message && message.content && message.content.find((c) => c.type === "output_text");
  return textPart ? textPart.text : "(No text response returned.)";
}

async function askGeminiVision(apiKey, base64Screenshot, question, history, attachment) {
  const model = "gemini-3.6-flash";
  const contents = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const parts = [
    { text: buildAttachmentTextPrefix(attachment) + question },
    { inline_data: { mime_type: "image/jpeg", data: base64Screenshot } },
  ];
  if (attachment && attachment.kind === "image") {
    parts.push({ inline_data: { mime_type: attachment.mimeType, data: attachment.base64 } });
  } else if (attachment && attachment.kind === "pdf") {
    parts.push({ inline_data: { mime_type: "application/pdf", data: attachment.base64 } });
  }
  contents.push({ role: "user", parts });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const candidate = data.candidates && data.candidates[0];
  const textPart = candidate && candidate.content && candidate.content.parts.find((p) => p.text);
  return textPart ? textPart.text : "(No text response returned.)";
}
