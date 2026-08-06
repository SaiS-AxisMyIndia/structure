// Minimal DOM-based stand-in for react-native-simple-toast on web - only
// `.show()`/`.SHORT` are actually used anywhere in src/, but the other
// constants/methods are stubbed too for API-surface parity with the real
// module (gravity/offset have no web equivalent, so they just fall back to
// the same bottom-center toast).
const DURATION_MS = { SHORT: 2000, LONG: 3500 };

function renderToast(message, durationMs) {
  if (typeof document === 'undefined') return;

  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    left: '50%',
    bottom: '48px',
    transform: 'translateX(-50%)',
    maxWidth: '90%',
    padding: '10px 20px',
    borderRadius: '24px',
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    color: '#fff',
    fontSize: '14px',
    textAlign: 'center',
    zIndex: 9999,
    opacity: '0',
    transition: 'opacity 0.2s ease-in-out',
    pointerEvents: 'none',
  });
  document.body.appendChild(toast);

  // Fade in on the next frame so the opacity transition actually runs.
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, durationMs);
}

const Toast = {
  SHORT: 0,
  LONG: 1,
  TOP: 0,
  BOTTOM: 1,
  CENTER: 2,
  show(message, duration) {
    renderToast(message, duration === Toast.LONG ? DURATION_MS.LONG : DURATION_MS.SHORT);
  },
  showWithGravity(message, duration) {
    Toast.show(message, duration);
  },
  showWithGravityAndOffset(message, duration) {
    Toast.show(message, duration);
  },
};

module.exports = Toast;
module.exports.default = Toast;
