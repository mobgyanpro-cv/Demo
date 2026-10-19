/* Mayra Dental Clinic — animation layer (no dependencies) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia && matchMedia('(max-width: 767px)').matches;
  function ready(fn) { doc.readyState !== 'loading' ? fn() : doc.addEventListener('DOMContentLoaded', fn); }

  root.classList.add('mx-js');

  ready(function () {
    try { init(); } catch (e) { root.classList.remove('mx-js'); if (window.console) console.warn('mayra.js', e); }
  });

  function init() {
    var body = doc.body;

    /* ---- 1. intro splash (once per browser session) ---- */
    try {
      if (!reduce && !sessionStorage.getItem('mxSplash')) {
        sessionStorage.setItem('mxSplash', '1');
        var sp = doc.createElement('div');
        sp.className = 'mx-splash';
        sp.setAttribute('aria-hidden', 'true');
        sp.innerHTML = '<b>MAYRA</b><i></i><span>DENTAL CLINIC</span>';
        body.appendChild(sp);
        var hide = function () { sp.classList.add('mx-out'); setTimeout(function () { sp.remove(); }, 900); };
        setTimeout(hide, 1500);
      }
    } catch (e) {}

    /* ---- 2. scroll progress + header state + back-to-top ---- */
    var bar = doc.createElement('div'); bar.className = 'mx-progress'; body.appendChild(bar);
    var top = doc.createElement('button'); top.className = 'mx-top'; top.type = 'button';
    top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    body.appendChild(top);

    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset || root.scrollTop;
        var h = Math.max(1, root.scrollHeight - window.innerHeight);
        bar.style.transform = 'scaleX(' + Math.min(1, y / h) + ')';
        body.classList.toggle('mx-scrolled', y > 60);
        top.classList.toggle('mx-show', y > 700);
        if (!reduce && !small) parallax();
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* ---- 3. photographs: wrap styling + gentle parallax ---- */
    var photos = [];
    function tagPhotos() {
      doc.querySelectorAll('.elementor-widget-image img, .elementor-widget-image-box img').forEach(function (img) {
        if (img.closest('.elementor-location-header, .elementor-location-footer, .elementor-widget-theme-site-logo')) return;
        if ((img.getAttribute('src') || '').indexOf('data:image/svg') === 0) return;
        if (img.dataset.mx) return;
        var apply = function () {
          if (img.dataset.mx) return;
          if ((img.naturalWidth || img.width) < 420) return;
          var wrap = img.closest('.elementor-widget-container') || img.parentElement;
          if (!wrap || wrap.classList.contains('mx-photo-wrap')) return;
          img.dataset.mx = '1';
          wrap.classList.add('mx-photo-wrap');
          photos.push({ img: img, wrap: wrap });
        };
        img.complete ? apply() : img.addEventListener('load', apply, { once: true });
      });
    }
    function parallax() {
      var vh = window.innerHeight;
      for (var i = 0; i < photos.length; i++) {
        var r = photos[i].wrap.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) continue;
        var p = (r.top + r.height / 2 - vh / 2) / vh;             // -1 .. 1
        photos[i].img.style.setProperty('--mx-py', (p * -18).toFixed(1) + 'px');
      }
    }
    tagPhotos();
    window.addEventListener('load', function () { tagPhotos(); onScroll(); });

    /* ---- 4. decorative rule under main headings ---- */
    doc.querySelectorAll('.elementor-location-header, .elementor-location-footer').forEach(function (n) { n.dataset.mxSkip = '1'; });
    doc.querySelectorAll('.elementor-widget-heading h2.elementor-heading-title').forEach(function (h) {
      if (h.closest('[data-mx-skip]') || h.dataset.mxRule) return;
      var cs = getComputedStyle(h);
      if (cs.fontFamily.indexOf('Amalfi') > -1) return;             // keep script-font headings clean
      h.dataset.mxRule = '1';
      var rule = doc.createElement('span'); rule.className = 'mx-rule mx-r-rule';
      if (cs.textAlign === 'center') rule.style.marginLeft = rule.style.marginRight = 'auto';
      h.insertAdjacentElement('afterend', rule);
    });

    /* ---- 5. scroll-reveal ---- */
    var targets = [];
    doc.querySelectorAll('.elementor-widget, .mx-rule').forEach(function (el) {
      if (el.closest('.elementor-location-header')) return;
      if (el.closest('[data-settings*="_animation"], .elementor-invisible')) return;
      if (el.matches('.elementor-widget-nav-menu, .elementor-widget-google_maps, .elementor-widget-video') && false) return;
      if (el.parentElement && el.parentElement.closest('.mx-r')) { /* nested widget inside revealed widget: skip */ return; }
      el.classList.add('mx-r');
      targets.push(el);
      // directional entrance for side-by-side widgets
      if (el.classList.contains('elementor-widget-image') || el.classList.contains('elementor-widget-text-editor')) {
        var par = el.parentElement;
        if (par && getComputedStyle(par).flexDirection === 'row' && par.children.length === 2) {
          el.classList.add(el === par.children[0] ? 'mx-left' : 'mx-right');
        }
      }
      if (el.classList.contains('elementor-widget-image') && !el.classList.contains('mx-left') && !el.classList.contains('mx-right')) el.classList.add('mx-zoom');
    });
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('mx-in'); });
    } else {
      var batch = 0, timer = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.style.setProperty('--mx-d', Math.min(batch++, 5) * 110 + 'ms');
          e.target.classList.add('mx-in');
          io.unobserve(e.target);
        });
        clearTimeout(timer); timer = setTimeout(function () { batch = 0; }, 160);
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      targets.forEach(function (t) { io.observe(t); });
      // safety net: never leave content hidden
      setTimeout(function () {
        targets.forEach(function (t) {
          var r = t.getBoundingClientRect();
          if (r.top < window.innerHeight && !t.classList.contains('mx-in')) t.classList.add('mx-in');
        });
      }, 2500);
    }

    /* ---- 6. smooth in-page anchors ---- */
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = null; try { t = doc.querySelector(id); } catch (x) {}
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });

    /* ---- 7. page transition between local pages ---- */
    if (!reduce) {
      doc.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
        var href = a.getAttribute('href');
        if (!/^[\w-]+\.html(#.*)?$/.test(href)) return;
        if (href.split('#')[0] === location.pathname.split('/').pop() || (href.indexOf('index.html') === 0 && /\/$/.test(location.pathname))) return;
        e.preventDefault();
        body.style.transition = 'opacity .35s ease'; body.style.opacity = '0';
        setTimeout(function () { location.href = href; }, 320);
      });
      window.addEventListener('pageshow', function (e) { if (e.persisted) { body.style.opacity = ''; } });
      body.style.opacity = '0';
      requestAnimationFrame(function () { body.style.transition = 'opacity .8s ease'; body.style.opacity = '1'; });
    }

    onScroll();
  }
})();
