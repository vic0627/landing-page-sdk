const closeAllDropdowns = () => {
  document.querySelectorAll<HTMLDetailsElement>('.dropdown[open]').forEach((dropdown) => {
    dropdown.removeAttribute('open');
  });
};

const initDropdowns = () => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.dropdown')) return;
    closeAllDropdowns();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeAllDropdowns();
  });
};

initDropdowns();
