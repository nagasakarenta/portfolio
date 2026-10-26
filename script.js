/* Renta Nagasaka — Portfolio interactions (no dependencies) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: mobile toggle + close on link click ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const links = $('#navLinks');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 834) setOpen(false); });

  /* ---------- Scroll reveal ---------- */
  // Hero reveals when the intro finishes (or at once when there is no intro).
  const INTRO_MS = 1000;              // intro plays for 1.0s, then wipes out (0.5s) → 1.5s total
  const INTRO_OUT_MS = 500;           // wipe duration (matches CSS)
  const intro = $('#intro');
  const seenIntro = (() => { try { return sessionStorage.getItem('introSeen') === '1'; } catch (_) { return false; } })();
  const showIntro = !!intro && !reduceMotion && !seenIntro;
  const heroReveal = () => {
    document.body.classList.add('intro-done');
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
  };
  let introFinished = false;
  const finishIntro = () => {
    if (introFinished) return;
    introFinished = true;
    try { sessionStorage.setItem('introSeen', '1'); } catch (_) {}
    if (intro) {
      intro.classList.add('intro--out');
      setTimeout(() => { intro.remove(); document.documentElement.classList.remove('is-intro'); }, INTRO_OUT_MS + 50);
    }
    document.documentElement.classList.remove('is-intro');
    setTimeout(heroReveal, 120);
    window.dispatchEvent(new Event('intro:done'));
  };
  if (showIntro) {
    document.documentElement.classList.add('is-intro');
    window.scrollTo(0, 0);
    intro.addEventListener('click', finishIntro);
    window.addEventListener('keydown', finishIntro, { once: true });
    setTimeout(finishIntro, INTRO_MS);
  } else {
    if (intro) intro.remove();
    document.body.classList.remove('has-intro');
    heroReveal();
  }
  const revealEls = $$('.reveal:not(.in):not(.hero .reveal), .device');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const duration = 1400;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const fmt = (v) => decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = fmt(target * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(el => cio.observe(el));
    } else {
      counters.forEach(el => { const d = Number(el.dataset.decimals || 0); el.textContent = d ? Number(el.dataset.count).toFixed(d) : Number(el.dataset.count).toLocaleString(); });
    }
  }

  /* ---------- Chart bars stagger index ---------- */
  $$('.mock__chart b').forEach((b, i) => b.style.setProperty('--i', i));

  /* ---------- Carousel ---------- */
  const carousel = $('#carousel');
  const prev = $('#prevBtn');
  const next = $('#nextBtn');
  if (carousel && prev && next) {
    const tileStep = () => {
      const tile = $('.tile', carousel);
      const gap = parseFloat(getComputedStyle(carousel).columnGap || getComputedStyle(carousel).gap) || 20;
      return tile ? tile.getBoundingClientRect().width + gap : 400;
    };
    const update = () => {
      const max = carousel.scrollWidth - carousel.clientWidth - 2;
      prev.disabled = carousel.scrollLeft <= 2;
      next.disabled = carousel.scrollLeft >= max;
    };
    prev.addEventListener('click', () => carousel.scrollBy({ left: -tileStep(), behavior: 'smooth' }));
    next.addEventListener('click', () => carousel.scrollBy({ left: tileStep(), behavior: 'smooth' }));
    carousel.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }


  /* ---------- Typewriter ---------- */
  const tw = $('#typewriter');
  if (tw) {
    const textEl = $('.typewriter__text', tw);
    let phrases = [];
    try { phrases = JSON.parse(tw.dataset.phrases || '[]'); } catch (_) {}
    if (!phrases.length) phrases = ['I build things that work beautifully.'];
    if (reduceMotion) {
      textEl.textContent = phrases[0];
    } else {
      let pi = 0, ci = 0, deleting = false;
      const tick = () => {
        const phrase = phrases[pi];
        ci += deleting ? -1 : 1;
        textEl.textContent = phrase.slice(0, ci);
        let delay = deleting ? 38 : 70 + Math.random() * 50;
        if (!deleting && ci === phrase.length) { delay = 2200; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 400; }
        setTimeout(tick, delay);
      };
      if (showIntro) window.addEventListener('intro:done', () => setTimeout(tick, 500), { once: true });
      else setTimeout(tick, 900);
    }
  }

  /* ---------- Split section titles into words ---------- */
  $$('.split').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      const inner = document.createElement('span');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- 3D tilt on pointer move ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${(px - .5) * 8}deg`);
        el.style.setProperty('--rx', `${(.5 - py) * 8}deg`);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
      });
    });
  }

  /* ---------- Hero parallax + fade on scroll ---------- */
  const heroContent = $('#heroContent');
  if (heroContent && !reduceMotion) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const h = window.innerHeight;
        const p = Math.min(1, y / h);
        heroContent.style.transform = `translateY(${y * 0.25}px)`;
        heroContent.style.opacity = String(1 - p * 1.1);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }


  /* ---------- Profile card (nav brand) ---------- */
  const pcard = $('#profileCard');
  const brandBtn = $('#brandBtn');
  if (pcard && brandBtn && typeof pcard.showModal === 'function') {
    const open = () => { setOpen(false); pcard.showModal(); };
    const close = () => pcard.close();
    brandBtn.addEventListener('click', open);
    $('#pcardClose').addEventListener('click', close);
    pcard.addEventListener('click', (e) => { if (e.target === pcard) close(); }); // backdrop click
    const vcardBtn = $('#vcardBtn');
    if (vcardBtn) {
      vcardBtn.addEventListener('click', () => {
        const vcf = [
          'BEGIN:VCARD', 'VERSION:3.0',
          'N:長坂;錬汰;;;', 'FN:長坂 錬汰',
          'X-PHONETIC-LAST-NAME:ながさか', 'X-PHONETIC-FIRST-NAME:れんた',
          'ORG:大阪大学 基礎工学部 情報科学科',
          'TITLE:Indie Developer / AI & DX Consultant',
          'EMAIL;TYPE=INTERNET:nagasakarenta@gmail.com',
          'URL:https://github.com/nagasakarenta',
          'URL;TYPE=Wantedly:https://www.wantedly.com/id/renta_n',
          'URL;TYPE=LinkedIn:https://www.linkedin.com/in/rentanagasaka/',
          'URL;TYPE=CrowdWorks:https://crowdworks.jp/public/employees/4082922',
          'END:VCARD'
        ].join('\r\n');
        const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Renta_Nagasaka.vcf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
    }
  } else if (brandBtn) {
    brandBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  }


  /* ---------- Project galleries ---------- */
  const GALLERIES = {
    stylemagic: {
      icon: 'assets/stylemagic/icon.png',
      eyebrow: 'iOS App · Swift · App Store 有料ランキング 18 位（2025.11）',
      title: 'スタイルマジック — AI 写真スタイル変換',
      desc: '写真を 1 枚選ぶだけで、アニメ・水彩・スケッチ・カートゥーンなど 11 種類の画風に変換する iOS アプリ。Swift で UI と課金・広告を実装し、画像生成 API は Vercel のプロキシ経由で呼び出し、生成結果は Cloudinary で配信。App Store の審査対応（ATT・価格表記の指摘など）も自分で切り抜けました。',
      facts: ['Swift', 'StoreKit', 'AdMob', 'Firebase', 'Cloudinary', 'Vercel', 'v1.5.1', '2025.06 —'],
      grid: 'styles',
      images: [
        { src: 'assets/stylemagic/anime.jpg', cap: 'アニメ' },
        { src: 'assets/stylemagic/anime90s.jpg', cap: '90 年代アニメ' },
        { src: 'assets/stylemagic/watercolor.jpg', cap: '水彩' },
        { src: 'assets/stylemagic/sketch.jpg', cap: 'スケッチ' },
        { src: 'assets/stylemagic/cartoon.jpg', cap: 'カートゥーン' },
        { src: 'assets/stylemagic/starewars.jpg', cap: 'SF 映画風' },
        { src: 'assets/stylemagic/bikkuriman.jpg', cap: 'シール風イラスト' }
      ],
      note: 'アプリ内のスタイル見本として実際に生成した画像です。'
    },
    english: {
      icon: 'assets/app-english-icon.png',
      eyebrow: 'iOS App · Swift ＋ Firebase · 2025.06 — 2026.02',
      title: '英作文添削 AI',
      desc: '大学受験生向けの英作文添削アプリ。GPT が文法・語彙・論理構成を採点し、東大・京大・早慶など大学別の採点基準で講評。手書き答案は OCR で読み取り、問題文と解答を自動で分離します。LINE Bot として始め、Swift 製 iOS アプリ v2.2 まで育てました。バックエンドは Firebase Functions（TypeScript）、運営用の管理ダッシュボードと利用分析も自作。',
      facts: ['Swift', 'Firebase Functions', 'TypeScript', 'OpenAI API', 'OCR', 'Vercel', 'v2.2.2'],
      grid: 'phones',
      images: [
        { src: 'assets/english/screen-1.jpg', cap: '画面 1' },
        { src: 'assets/english/screen-2.jpg', cap: '画面 2' },
        { src: 'assets/english/screen-3.jpg', cap: '画面 3' },
        { src: 'assets/english/screen-4.jpg', cap: '画面 4' }
      ],
      note: '現在は App Store での配信を終了しています。'
    }
  };
  const gdlg = $('#galleryDialog');
  if (gdlg && typeof gdlg.showModal === 'function') {
    const openGallery = (key) => {
      const g = GALLERIES[key]; if (!g) return;
      $('#galleryIcon').src = g.icon;
      $('#galleryEyebrow').textContent = g.eyebrow;
      $('#galleryTitle').textContent = g.title;
      $('#galleryDesc').textContent = g.desc;
      const facts = $('#galleryFacts');
      facts.replaceChildren(...g.facts.map(f => { const li = document.createElement('li'); li.textContent = f; return li; }));
      const grid = $('#galleryGrid');
      grid.className = 'gallery__grid' + (g.grid === 'phones' ? ' gallery__grid--phones' : '');
      grid.replaceChildren(...g.images.map(im => {
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.src = im.src; img.alt = im.cap; img.loading = 'lazy';
        img.style.setProperty('--ar', g.grid === 'phones' ? '9/19.5' : '4/3');
        const cap = document.createElement('figcaption');
        cap.textContent = im.cap;
        fig.append(img, cap);
        return fig;
      }));
      $('#galleryNote').textContent = g.note || '';
      gdlg.showModal();
      $('.gallery__inner', gdlg).scrollTop = 0;
    };
    $$('[data-gallery]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openGallery(el.dataset.gallery); }));
    $('#galleryClose').addEventListener('click', () => gdlg.close());
    gdlg.addEventListener('click', (e) => { if (e.target === gdlg) gdlg.close(); });
  }


  /* ---------- About: scroll-linked text highlight ---------- */
  const statement = $('.statement');
  if (statement && !reduceMotion && CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')) {
    // Wrap every character (Latin words stay whole) in a span we can light up.
    const wrapText = (node) => {
      if (node.nodeType === 3) {
        const text = node.nodeValue;
        if (!text.trim()) return;
        const frag = document.createDocumentFragment();
        const tokens = text.match(/[A-Za-z0-9][A-Za-z0-9./+&-]*|\s+|[^\sA-Za-z0-9]/g) || [];
        tokens.forEach(tok => {
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = tok; frag.appendChild(sp);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && !node.classList.contains('statement__lead')) {
        [...node.childNodes].forEach(wrapText);
      }
    };
    $$('p:not(.statement__lead)', statement).forEach(p => [...p.childNodes].forEach(wrapText));
    const chars = $$('.ch', statement);
    statement.classList.add('is-live');
    let active = false, ticking = false;
    const paint = () => {
      ticking = false;
      const vh = window.innerHeight;
      const start = vh * 0.88, span = vh * 0.38;   // a char is fully lit once it rises above ~50% of the viewport
      chars.forEach(ch => {
        const y = ch.getBoundingClientRect().top + ch.offsetHeight / 2;
        const p = Math.min(1, Math.max(0, (start - y) / span));
        ch.style.setProperty('--p', p.toFixed(2));
      });
    };
    const onScroll = () => { if (!active || ticking) return; ticking = true; requestAnimationFrame(paint); };
    new IntersectionObserver((entries) => {
      active = entries.some(e => e.isIntersecting);
      if (active) onScroll();
    }, { rootMargin: '20% 0px 20% 0px' }).observe(statement);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  }

  /* ---------- Active nav link while scrolling ---------- */
  const sections = $$('main section[id]');
  const navAnchors = $$('a[href^="#"]', links).filter(a => a.getAttribute('href') !== '#top');
  if ('IntersectionObserver' in window && sections.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navAnchors.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => sio.observe(s));
  }
})();
