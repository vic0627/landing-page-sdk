import '@/components/header/dropdown';
import '@/styles/main.css';

const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const showElement = (element: HTMLElement) => {
  element.classList.remove('opacity-0', 'translate-y-4');
  element.classList.add('opacity-100', 'translate-y-0');
};

if (prefersReducedMotion) {
  revealElements.forEach(showElement);
} else if (revealElements.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        showElement(entry.target as HTMLElement);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 80, 240)}ms`;
    observer.observe(element);
  });
}

document.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
  const text = block.textContent ?? '';
  if (block.innerHTML !== text) {
    block.textContent = text;
  }
});
