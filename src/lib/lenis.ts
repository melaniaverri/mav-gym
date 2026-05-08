import Lenis from 'lenis';

// Singleton: una sola istanza Lenis condivisa tra tutti i componenti
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

// Helper per scroll smooth a un elemento (usa Lenis se attivo, altrimenti fallback nativo)
export function smoothScrollToElement(elementOrId: HTMLElement | string, offset = 0) {
  const target = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!target) return;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.2 });
  } else {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}
