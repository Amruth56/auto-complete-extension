export class SuggestEngine {
  private words: string[] = [];
  private loaded = false;

  constructor(private maxResults = 6) {}

  async load() {
    const url = chrome.runtime.getURL("words.json");
    const res = await fetch(url);
    const arr = await res.json();
    this.words = arr;
    this.loaded = true;
  }

  private lowerBound(prefix: string) {
    let l = 0, r = this.words.length;
    while (l < r) {
      const m = (l + r) >> 1;
      if (this.words[m].slice(0, prefix.length) < prefix) l = m + 1;
      else r = m;
    }
    return l;
  }

  get(prefix: string): string[] {
    if (!this.loaded) return [];
    prefix = prefix.toLowerCase();

    const start = this.lowerBound(prefix);
    const results: string[] = [];

    for (let i = start; i < this.words.length && results.length < this.maxResults; i++) {
      if (this.words[i].startsWith(prefix)) results.push(this.words[i]);
      else break;
    }
    return results;
  }
}
