// Shared screen glow controller
// Use `triggerScreenGlow()` from pages/components to play the ambient glow.
let glowTimeout = null;

export function triggerScreenGlow(duration = 2000) {
  try {
    if (typeof window === "undefined") return;

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const overlay = document.getElementById('screen-glow-overlay');
    if (!overlay) return;

    // Ensure class removed then re-added to restart animation cleanly
    overlay.classList.remove('screen-glow-active');
    // Force style recalculation to ensure restart
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetWidth;
    overlay.classList.add('screen-glow-active');

    if (glowTimeout) {
      clearTimeout(glowTimeout);
      glowTimeout = null;
    }

    glowTimeout = setTimeout(() => {
      overlay.classList.remove('screen-glow-active');
      glowTimeout = null;
    }, duration);
  } catch (err) {
    // Fail silently - non-critical UI effect
    // eslint-disable-next-line no-console
    console.error('screenGlow trigger error', err);
  }
}
