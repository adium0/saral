import { create } from 'zustand';

// Polite live region messages ("Reading", "Paused", "Simplifying", "Listening").
export const useAnnounce = create((set) => ({
  message: '',
  announce: (message) => {
    set({ message: '' });
    setTimeout(() => set({ message }), 50);
  },
}));

export const announce = (m) => useAnnounce.getState().announce(m);
