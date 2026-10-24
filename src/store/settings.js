import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULTS = {
  // F2 display
  font: 'atkinson', // system | atkinson | lexend | opendyslexic
  fontSize: 20,
  lineHeight: 1.6,
  letterSpacing: 0,
  wordSpacing: 0,
  lineLength: 70,
  theme: 'system', // system | light | dark | cream | contrast
  lineFocus: false,
  focusLines: 2,
  // F3 read-aloud
  rate: 1,
  voiceURI: null,
  pinPlayer: false,
  shortcuts: true,
  // F4 captions
  captionSize: 36,
  captionLines: 3,
  captionPosition: 'bottom',
  captionLang: 'en-IN',
  announceCaptions: false,
  // F6 presets and layout
  preset: null,
  hidePanels: false,
  summaryFirst: false,
  // Motion: system follows the OS setting; calm turns all decorative motion off.
  motion: 'system',
  onboarded: false,
};

export const PRESETS = {
  'low-vision': {
    label: 'Low vision',
    blurb: 'Big text, high contrast and read-aloud always at hand.',
    settings: { fontSize: 28, theme: 'contrast', lineHeight: 1.8, pinPlayer: true, font: 'atkinson', lineFocus: false, hidePanels: false, summaryFirst: false },
  },
  dyslexia: {
    label: 'Dyslexia-friendly',
    blurb: 'Lexend, wider spacing, cream paper and a focus line.',
    settings: { font: 'lexend', fontSize: 20, letterSpacing: 0.05, lineHeight: 2, theme: 'cream', lineLength: 60, lineFocus: true, hidePanels: false, summaryFirst: false },
  },
  hearing: {
    label: 'Hard of hearing',
    blurb: 'Opens live captions in large type with the transcript beside them.',
    settings: { captionSize: 32, hidePanels: false, summaryFirst: false },
    route: '/captions',
  },
  focus: {
    label: 'Focus',
    blurb: 'Fewer panels, the summary first and a focus line.',
    settings: { hidePanels: true, summaryFirst: true, lineFocus: true },
  },
};

export const FONTS = {
  system: { label: 'System default', css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  atkinson: { label: 'Atkinson Hyperlegible', css: '"Atkinson Hyperlegible", system-ui, sans-serif' },
  lexend: { label: 'Lexend', css: '"Lexend Variable", "Lexend", system-ui, sans-serif' },
  opendyslexic: { label: 'OpenDyslexic', css: '"OpenDyslexic", system-ui, sans-serif' },
};

export const THEMES = {
  system: 'Match my device',
  light: 'Light',
  dark: 'Dark',
  cream: 'Cream',
  contrast: 'High contrast (yellow on black)',
};

export const useSettings = create(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set(patch),
      applyPreset: (id) =>
        set((s) => ({ ...DEFAULTS, voiceURI: s.voiceURI, rate: s.rate, motion: s.motion, onboarded: true, ...PRESETS[id].settings, preset: id })),
      reset: () => set((s) => ({ ...DEFAULTS, onboarded: s.onboarded })),
    }),
    { name: 'saral-settings', version: 1 },
  ),
);
