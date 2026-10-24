// Live captions on the Web Speech API (Chrome and Edge). Restarts on silence while active.

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const sttSupported = Boolean(Recognition);

/**
 * callbacks: onInterim(text), onFinal(text), onStatus('listening'|'paused'|'off'|'error', detail)
 */
export class Captioner {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.active = false;
    this.lang = 'en-IN';
    this.rec = null;
    this.restartTimer = null;
    this.failures = 0;
  }

  start(lang = this.lang) {
    if (!sttSupported) {
      this.cb.onStatus?.('error', 'unsupported');
      return;
    }
    this.lang = lang;
    this.active = true;
    this.failures = 0;
    this.open();
  }

  open() {
    const rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = this.lang;
    rec.maxAlternatives = 1;
    rec.onstart = () => this.cb.onStatus?.('listening');
    rec.onresult = (e) => {
      this.failures = 0;
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (r.isFinal) {
          if (text) this.cb.onFinal?.(text);
        } else interim += `${text} `;
      }
      this.cb.onInterim?.(interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.active = false;
        this.cb.onStatus?.('error', 'denied');
      } else if (e.error === 'network') {
        this.failures += 1;
        this.cb.onStatus?.('error', 'network');
      } else if (e.error === 'audio-capture') {
        this.active = false;
        this.cb.onStatus?.('error', 'no-mic');
      }
      // "no-speech" and "aborted" are normal; onend restarts.
    };
    rec.onend = () => {
      this.cb.onInterim?.('');
      if (this.active && this.failures < 5) {
        this.cb.onStatus?.('paused');
        clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => this.active && this.open(), 250 + this.failures * 500);
      } else if (!this.active) {
        this.cb.onStatus?.('off');
      } else {
        this.active = false;
        this.cb.onStatus?.('error', 'network');
      }
    };
    this.rec = rec;
    try {
      rec.start();
    } catch {
      /* already started */
    }
  }

  stop() {
    this.active = false;
    clearTimeout(this.restartTimer);
    try {
      this.rec?.stop();
    } catch {
      /* not running */
    }
    this.cb.onStatus?.('off');
  }
}

// One-shot listener for voice commands.
export function listenForCommands(lang, onCommand, onStatus) {
  if (!sttSupported) return null;
  let active = true;
  let rec;
  const open = () => {
    rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = lang;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onCommand(e.results[i][0].transcript.toLowerCase().trim());
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        active = false;
        onStatus?.('denied');
      }
    };
    rec.onend = () => active && setTimeout(open, 250);
    try {
      rec.start();
      onStatus?.('listening');
    } catch {
      /* ignore */
    }
  };
  open();
  return () => {
    active = false;
    try {
      rec?.stop();
    } catch {
      /* ignore */
    }
    onStatus?.('off');
  };
}
