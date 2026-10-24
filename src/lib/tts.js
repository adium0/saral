// Read-aloud engine on the Web Speech API. Text is queued one sentence at a time,
// so long chapters never get cut off by the browser.

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function getVoices() {
  if (!ttsSupported) return [];
  return window.speechSynthesis.getVoices();
}

export function onVoicesChanged(cb) {
  if (!ttsSupported) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener?.('voiceschanged', cb);
  return () => synth.removeEventListener?.('voiceschanged', cb);
}

// English (India) and Hindi first, then other English voices.
export function sortVoices(voices) {
  const rank = (v) => (v.lang === 'en-IN' ? 0 : v.lang === 'hi-IN' ? 1 : v.lang.startsWith('en') ? 2 : 3);
  return [...voices].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function pickVoice(voiceURI, lang) {
  const voices = getVoices();
  if (voiceURI) {
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v && (!lang || v.lang.slice(0, 2) === lang.slice(0, 2))) return v;
  }
  if (lang) return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2))) || null;
  return voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang.startsWith('en')) || null;
}

/**
 * Speaker plays a list of sentences [{id, text}] from an index.
 * Callbacks: onSentence(index), onWord(index, start, length), onState('playing'|'paused'|'stopped'), onEnd()
 */
export class Speaker {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.items = [];
    this.index = 0;
    this.rate = 1;
    this.voiceURI = null;
    this.lang = null;
    this.state = 'stopped';
    this.token = 0;
    this.gotBoundary = false;
    this.keepAlive = null;
  }

  setItems(items) {
    this.items = items;
  }

  setRate(rate) {
    this.rate = rate;
    if (this.state === 'playing') this.play(this.index);
  }

  setVoice(voiceURI) {
    this.voiceURI = voiceURI;
    if (this.state === 'playing') this.play(this.index);
  }

  setState(s) {
    this.state = s;
    this.cb.onState?.(s);
  }

  play(index = this.index) {
    if (!ttsSupported || this.items.length === 0) return;
    const synth = window.speechSynthesis;
    this.token += 1;
    const token = this.token;
    synth.cancel();
    this.index = Math.max(0, Math.min(index, this.items.length - 1));
    this.setState('playing');
    this.speakCurrent(token);
    // Chrome stops long speech after ~15 s unless it is nudged.
    clearInterval(this.keepAlive);
    this.keepAlive = setInterval(() => {
      if (this.state === 'playing' && synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
  }

  speakCurrent(token) {
    const item = this.items[this.index];
    if (!item) return;
    const u = new SpeechSynthesisUtterance(item.text);
    const voice = pickVoice(this.voiceURI, item.lang || this.lang);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else if (item.lang) {
      u.lang = item.lang;
    }
    u.rate = this.rate;
    this.cb.onSentence?.(this.index);
    u.onboundary = (e) => {
      if (token !== this.token) return;
      if (e.name && e.name !== 'word') return;
      this.gotBoundary = true;
      let len = e.charLength;
      if (!len) {
        const m = /^[^\s]+/.exec(item.text.slice(e.charIndex));
        len = m ? m[0].length : 1;
      }
      this.cb.onWord?.(this.index, e.charIndex, len);
    };
    u.onend = () => {
      if (token !== this.token || this.state !== 'playing') return;
      if (this.index < this.items.length - 1) {
        this.index += 1;
        this.speakCurrent(token);
      } else {
        this.stop();
        this.cb.onEnd?.();
      }
    };
    u.onerror = (e) => {
      if (token !== this.token) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      this.cb.onError?.(e.error);
    };
    window.speechSynthesis.speak(u);
  }

  pause() {
    if (this.state !== 'playing') return;
    // Resuming a paused utterance is unreliable in Chrome, so pause = stop and remember the sentence.
    this.token += 1;
    window.speechSynthesis.cancel();
    clearInterval(this.keepAlive);
    this.setState('paused');
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else this.play(this.index);
  }

  stop() {
    this.token += 1;
    if (ttsSupported) window.speechSynthesis.cancel();
    clearInterval(this.keepAlive);
    this.setState('stopped');
  }

  next() {
    if (this.index < this.items.length - 1) {
      if (this.state === 'playing') this.play(this.index + 1);
      else {
        this.index += 1;
        this.cb.onSentence?.(this.index);
      }
    }
  }

  prev() {
    if (this.index > 0) {
      if (this.state === 'playing') this.play(this.index - 1);
      else {
        this.index -= 1;
        this.cb.onSentence?.(this.index);
      }
    }
  }
}

// One-off speech, used for word pronunciation and short snippets.
export function speakOnce(text, { lang, rate = 1, voiceURI } = {}) {
  if (!ttsSupported) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(voiceURI, lang);
  if (v) u.voice = v;
  if (lang) u.lang = lang;
  u.rate = rate;
  window.speechSynthesis.speak(u);
}
