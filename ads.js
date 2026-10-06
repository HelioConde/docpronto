(() => {
  const config = window.DOCPRONTO_ADS || {};
  if (!config.enabled || !config.publisherId) return;

  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  const publicMode = Boolean(
    (hash.get('proposta') || query.get('proposta')) &&
    (hash.get('token') || query.get('token'))
  );
  const allowedPlacement = publicMode ? 'public-footer' : 'app-footer';
  const slots = {
    'app-footer': config.slots?.appFooter,
    'public-footer': config.slots?.publicFooter
  };

  const active = Array.from(document.querySelectorAll('[data-ad-placement]')).filter(container => {
    if (container.dataset.adPlacement !== allowedPlacement) return false;
    const slot = slots[container.dataset.adPlacement];
    if (!slot) return false;
    const ad = container.querySelector('.adsbygoogle');
    if (!ad) return false;
    ad.dataset.adClient = config.publisherId;
    ad.dataset.adSlot = slot;
    container.hidden = false;
    return true;
  });

  if (!active.length) return;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.publisherId)}`;
  script.onload = () => {
    active.forEach(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.warn('DocPronto: anúncio não pôde ser inicializado.', error);
      }
    });
  };
  document.head.append(script);
})();
