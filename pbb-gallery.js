const PBBGallery = (() => {
  const defaultCardClass = 'card gallery-card';
  const mediaBaseUrl = new URL('./', window.location.href).href.replace(/\/+$/, '');
  const createCardElement = (item, innerHtml) => {
    const card = document.createElement('article');
    card.className = defaultCardClass;
    card.dataset.category = (item.category || []).join(' ');
    card.innerHTML = `<div class="gallery-card-content">${innerHtml}</div>`;
    return card;
  };

  const createImageCard = (item) => {
    return createCardElement(item, `
      <button class="preview-trigger" type="button" data-preview-modal data-full="${item.full}" data-full-2x="${item.full2x || item.full}" data-thumb="${item.thumb || ''}" data-title="${item.title || 'Preview'}" data-alt="${item.alt}" aria-label="Open ${item.title || 'image'} preview">
        <img src="${item.thumb}" alt="${item.alt}" loading="lazy" class="gallery-thumb" />
      </button>
      <h3>${item.title}</h3>
      <p class="muted">${item.caption}</p>
    `);
  };

  const createVideoCard = (item) => {
    return createCardElement(item, `
      <div class="gallery-video-wrap">
        <video controls muted playsinline poster="${item.thumb}" class="gallery-video"><source src="${item.video}" type="video/mp4"></video>
      </div>
      <h3>${item.title}</h3>
      <p class="muted">${item.caption}</p>
    `);
  };

  const createCard = (item) => {
    return createCardElement(item, `
      <div class="gallery-meta">
        <p class="muted" style="margin:0; text-transform:uppercase; letter-spacing:.08em; font-size:11px;">${item.title}</p>
        <p style="margin:6px 0 0; font-weight:700;">${item.caption}</p>
      </div>
      <p class="muted" style="margin-top:10px;">${item.description || ''}</p>
    `);
  };

  let mediaViewer = null;
  let mediaViewerHost = null;

  const ensureMediaViewer = async () => {
    if (!window.uiLoader || typeof window.uiLoader.load !== 'function') {
      throw new Error('PBB helpers required: uiLoader missing in gallery preview.');
    }
    await window.uiLoader.load('ui.media.viewer');
    const createMediaViewer = await window.uiLoader.get('ui.media.viewer');
    if (typeof createMediaViewer !== 'function') {
      throw new Error('PBB helpers required: ui.media.viewer not available.');
    }

    if (!mediaViewerHost) {
      mediaViewerHost = document.createElement('div');
      document.body.appendChild(mediaViewerHost);
    }
    if (!mediaViewer) {
      mediaViewer = createMediaViewer(mediaViewerHost, {
        items: [],
        fit: 'contain',
        showFooter: false,
        showCounter: true,
        showToolbar: true,
        showClose: true,
        showPrevNext: false,
        keyboard: true,
        autoplayVideo: true,
        mutedVideo: false,
        open: false,
        baseUrl: mediaBaseUrl,
        ariaLabel: 'Project Bantay Bayan gallery viewer',
      });
    }

    return mediaViewer;
  };

  const openPreview = async (target, galleryGrid) => {
    const viewer = await ensureMediaViewer();
    const triggers = Array.from(galleryGrid.querySelectorAll('[data-preview-modal]'))
      .filter((node) => node.offsetParent !== null);

    const items = triggers.map((node) => {
      const full = node.getAttribute('data-full') || node.getAttribute('data-full-2x') || '';
      const alt = node.getAttribute('data-alt') || 'Image preview';
      return {
        type: node.getAttribute('data-video') ? 'video' : 'image',
        src: node.getAttribute('data-video') || full,
        thumb: node.getAttribute('data-thumb') || '',
        poster: node.getAttribute('data-thumb') || '',
        alt,
        title: node.getAttribute('data-title') || 'Preview',
      };
    });

    const startIndex = Math.max(0, triggers.indexOf(target));

    viewer.update({
      items,
      index: startIndex,
      fit: 'contain',
      showFooter: false,
      showPrevNext: items.length > 1,
      baseUrl: mediaBaseUrl,
    });
    viewer.open(startIndex);
  };

  const renderItem = (item) => {
    if (item.type === 'image') return createImageCard(item);
    if (item.type === 'video') return createVideoCard(item);
    return createCard(item);
  };

  const applyFiltering = (galleryGrid, filter) => {
    const cards = galleryGrid.querySelectorAll('.gallery-card');
    cards.forEach((card) => {
      const cats = (card.dataset.category || '').split(' ').filter(Boolean);
      card.style.display = filter === 'all' || cats.includes(filter) ? '' : 'none';
    });
  };

  const init = ({ galleryGridId, filterButtonsSelector, items = [] }) => {
    if (!window.uiLoader || typeof window.uiLoader.load !== 'function') {
      throw new Error('PBB helpers are required: uiLoader is missing in gallery init.');
    }
    const galleryGrid = document.getElementById(galleryGridId);
    if (!galleryGrid) return;

    const filterButtons = document.querySelectorAll(filterButtonsSelector);
    let currentFilter = 'all';

    const setActive = (selected) => {
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      selected.classList.add('active');
    };

    galleryGrid.innerHTML = '';
    items.forEach((item) => galleryGrid.appendChild(renderItem(item)));

    galleryGrid.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-preview-modal]');
      if (!trigger) return;
      openPreview(trigger, galleryGrid);
    });

    if (filterButtons.length > 0) {
      filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
          currentFilter = button.getAttribute('data-gallery-filter') || 'all';
          setActive(button);
          applyFiltering(galleryGrid, currentFilter);
        });
      });
    }

    applyFiltering(galleryGrid, currentFilter);
  };

  const autoInit = () => {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    if (typeof galleryItems === 'undefined' || !Array.isArray(galleryItems)) {
      throw new Error('galleryItems must be defined before initializing the gallery.');
    }

    init({
      galleryGridId: 'galleryGrid',
      filterButtonsSelector: '[data-gallery-filter]',
      items: galleryItems
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }

  return { init };
})();
