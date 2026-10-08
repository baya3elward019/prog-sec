/* =====================================================
   app.js — Bootstrapping, Theme, Fullscreen, Idle controls
===================================================== */
const App = (() => {
  const LS = {
    THEME: 'sp_theme',
    SLIDE: 'sp_slide',
    SCORE: 'sp_quiz_score'
  };

  /* ---------- THEME ---------- */
  function initTheme() {
    const saved = localStorage.getItem(LS.THEME);
    const theme = saved || 'dark';
    document.body.dataset.theme = theme;
    updateThemeIcon(theme);
    document.getElementById('btnTheme')?.addEventListener('click', toggleTheme);
  }

  function toggleTheme() {
    const cur = document.body.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem(LS.THEME, next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    const path = document.getElementById('themeIconPath');
    if (!path) return;
    if (theme === 'dark') {
      // Sun icon (click → go light)
      path.setAttribute('d', 'M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z');
    } else {
      path.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    }
  }

  /* ---------- FULLSCREEN ---------- */
  function initFullscreen() {
    document.getElementById('btnFullscreen')?.addEventListener('click', toggleFullscreen);
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  /* ---------- IDLE HIDE CONTROLS ---------- */
  function initIdleHide() {
    let timer = null;
    const controls = document.getElementById('controls');
    const topbar = document.getElementById('topbar');
    const show = () => {
      controls?.classList.remove('hidden');
      topbar?.classList.remove('hidden');
    };
    const hide = () => {
      // Only hide on wide screens or fullscreen
      if (window.matchMedia('(min-width:768px)').matches || document.fullscreenElement) {
        controls?.classList.add('hidden');
        topbar?.classList.add('hidden');
      }
    };
    const reset = () => {
      show();
      clearTimeout(timer);
      timer = setTimeout(hide, 2500);
    };
    ['mousemove','touchstart','keydown','click'].forEach(ev =>
      window.addEventListener(ev, reset, { passive: true })
    );
    reset();
  }

  /* ---------- LOADER ---------- */
  function hideLoader() {
    const loader = document.getElementById('loader');
    setTimeout(() => loader?.classList.add('hide'), 800);
  }

  /* ---------- KEYBOARD SHORTCUTS ---------- */
  function initShortcuts(nav) {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input,textarea')) return;
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); nav.next(); break;
        case 'ArrowLeft': e.preventDefault(); nav.prev(); break;
        case ' ': case 'Spacebar': e.preventDefault(); nav.next(); break;
        case 'Home': e.preventDefault(); nav.go(0); break;
        case 'End': e.preventDefault(); nav.go(999); break;
        case 'Escape': if (document.fullscreenElement) document.exitFullscreen(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 't': case 'T': toggleTheme(); break;
      }
    });
  }

  /* ---------- SWIPE ---------- */
  function initSwipe(nav) {
    let x0 = 0, y0 = 0, t0 = 0;
    const deck = document.getElementById('deck');
    deck.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
    }, { passive: true });

    deck.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - x0;
      const dy = t.clientY - y0;
      const dt = Date.now() - t0;
      if (dt > 800) return;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      // RTL: swipe right (dx>0) → previous ; swipe left → next
      if (dx > 0) nav.prev(); else nav.next();
    }, { passive: true });
  }

  /* ---------- OVERVIEW ---------- */
  function initOverview(nav) {
    const modal = document.getElementById('overview');
    const grid = document.getElementById('overviewGrid');
    const openBtn = document.getElementById('btnOverview');
    const closeBtn = document.getElementById('closeOverview');

    function build() {
      grid.innerHTML = '';
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, i) => {
        const card = document.createElement('button');
        card.className = 'ov-card' + (i === nav.current() ? ' active' : '');
        card.innerHTML = `
          <div class="ov-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="ov-title">${s.dataset.title || 'شريحة'}</div>
          <div class="ov-progress"><div class="ov-progress-fill" style="width:${((i+1)/slides.length)*100}%"></div></div>
        `;
        card.addEventListener('click', () => {
          nav.go(i);
          close();
        });
        grid.appendChild(card);
      });
    }
    function open() { build(); modal.hidden = false; }
    function close() { modal.hidden = true; }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  /* ---------- MODAL (principle/stride) ---------- */
  function openModal(html) {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    body.innerHTML = html;
    modal.hidden = false;
  }
  function initModal() {
    const modal = document.getElementById('modal');
    modal?.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) modal.hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
    });
  }

  /* ---------- BOOT ---------- */
  function boot() {
    initTheme();
    initFullscreen();
    initIdleHide();
    initModal();

    const nav = Navigation.init({
      onChange: (i, total) => {
        localStorage.setItem(LS.SLIDE, i);
      }
    });

    initShortcuts(nav);
    initSwipe(nav);
    initOverview(nav);

    // restore last slide
    const saved = parseInt(localStorage.getItem(LS.SLIDE) || '0', 10);
    if (saved > 0) nav.go(saved);

    Slides.render();
    Quiz.init();
    Animations.init();

    hideLoader();
    window.__nav = nav; // expose for debugging
  }

  return { boot, openModal, toggleTheme, toggleFullscreen };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());