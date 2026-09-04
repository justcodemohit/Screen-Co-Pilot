const providerSelect = document.getElementById("providerSelect");
const apiKeyLabel = document.getElementById("apiKeyLabel");
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const keyStatus = document.getElementById("keyStatus");
const launchBtn = document.getElementById("launchBtn");

const PROVIDER_META = {
  anthropic: { label: "Anthropic API key", placeholder: "sk-ant-...", storageKey: "anthropicApiKey" },
  openai: { label: "OpenAI API key", placeholder: "sk-...", storageKey: "openaiApiKey" },
  gemini: { label: "Gemini API key", placeholder: "AIza...", storageKey: "geminiApiKey" },
};

function currentMeta() {
  return PROVIDER_META[providerSelect.value];
}

async function loadKeyForCurrentProvider() {
  const meta = currentMeta();
  apiKeyLabel.textContent = meta.label;
  apiKeyInput.placeholder = meta.placeholder;
  const result = await chrome.storage.local.get([meta.storageKey]);
  apiKeyInput.value = result[meta.storageKey] || "";
}

// Restore last-selected provider, then load its key.
chrome.storage.local.get(["selectedProvider"], async (result) => {
  if (result.selectedProvider && PROVIDER_META[result.selectedProvider]) {
    providerSelect.value = result.selectedProvider;
  }
  await loadKeyForCurrentProvider();
});

providerSelect.addEventListener("change", async () => {
  chrome.storage.local.set({ selectedProvider: providerSelect.value });
  keyStatus.textContent = "";
  await loadKeyForCurrentProvider();
});

saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.style.color = "#f97583";
    keyStatus.textContent = "Enter a key first.";
    return;
  }
  const meta = currentMeta();
  chrome.storage.local.set(
    { [meta.storageKey]: key, selectedProvider: providerSelect.value },
    () => {
      keyStatus.style.color = "#7ee787";
      keyStatus.textContent = "Saved ✓";
      setTimeout(() => (keyStatus.textContent = ""), 2000);
    }
  );
});

launchBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("launcher.html") });
});
