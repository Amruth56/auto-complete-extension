import { SuggestEngine } from "./engine";

const engine = new SuggestEngine();
engine.load();

injectStyles();

let dropdown: HTMLDivElement | null = null;
let activeEl: HTMLInputElement | HTMLTextAreaElement | null = null;

createDropdown();

function injectStyles() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("styles.css");
  document.head.appendChild(link);
}

function createDropdown() {
  dropdown = document.createElement("div");
  dropdown.className = "smart-suggest-dropdown";
  document.body.appendChild(dropdown);
}

document.addEventListener("input", onInput, true);

function onInput(e: Event) {
  const el = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!isEditable(el)) return;

  activeEl = el;

  const value = el.value;
  const caret = el.selectionStart || value.length;

  const prefix = value.slice(0, caret).split(/\s+/).pop() || "";

  if (prefix.length < 2) {
    hide();
    return;
  }

  const local = engine.get(prefix);
  show(local);

  chrome.runtime.sendMessage({ action: "apiSuggest", prefix }, (resp) => {
    if (resp?.suggestions) show(resp.suggestions);
  });
}

function isEditable(el: HTMLElement) {
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA";
}

function show(list: string[]) {
  if (!dropdown || !activeEl) return;

  dropdown.innerHTML = "";

  list.forEach((w) => {
    const div = document.createElement("div");
    div.className = "smart-suggest-item";
    div.textContent = w;
    div.onclick = () => insert(w);
    dropdown.appendChild(div);
  });

  const rect = activeEl.getBoundingClientRect();
  dropdown.style.left = rect.left + "px";
  dropdown.style.top = rect.bottom + 4 + "px";
  dropdown.style.display = "block";
}

function hide() {
  if (dropdown) dropdown.style.display = "none";
}

function insert(word: string) {
  if (!activeEl) return;

  const text = activeEl.value;
  const caret = activeEl.selectionStart || text.length;

  const before = text.slice(0, caret).split(/\s+/);
  before.pop();

  const after = text.slice(caret);

  activeEl.value = [...before, word].join(" ") + " " + after;

  const newPos = [...before, word].join(" ").length + 1;

  activeEl.setSelectionRange(newPos, newPos);
  activeEl.dispatchEvent(new Event("input", { bubbles: true }));

  hide();
}
