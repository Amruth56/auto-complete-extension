import { DEFAULT_API_KEY, OPENROUTER_URL, MODEL_NAME } from "./env";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "apiSuggest") {
    handleSuggest(msg.prefix, sendResponse);
    return true;
  }

  if (msg.action === "setApiKey") {
    chrome.storage.sync.set({ userApiKey: msg.key }, () =>
      sendResponse({ success: true })
    );
    return true;
  }

  if (msg.action === "getApiKey") {
    chrome.storage.sync.get(["userApiKey"], (res) =>
      sendResponse({ apiKey: res.userApiKey })
    );
    return true;
  }
});


async function handleSuggest(prefix: string, sendResponse: Function) {
  try {
    const storage = await chrome.storage.sync.get(["userApiKey"]);

    const apiKey = storage.userApiKey || DEFAULT_API_KEY;

    const prompt = `Give me 10 short autocomplete suggestions (single words) that start with "${prefix}". 
Reply ONLY as a JSON array like ["word1","word2"].`;

    const body = {
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.3
    };

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "[]";

    let arr: string[] = [];
    try {
      arr = JSON.parse(text);
    } catch {
      arr = text.split(/\s+/).slice(0, 10);
    }

    sendResponse({ suggestions: arr });
  } catch (e) {
    sendResponse({ suggestions: [] });
  }
}
