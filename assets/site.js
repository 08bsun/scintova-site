(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ticker: duplicate for a seamless loop
  var t = document.getElementById('ticker');
  if (t) t.innerHTML += t.innerHTML;

  // hero video
  var hv = document.querySelector('.phone video');
  if (hv && !reduce) { hv.src = hv.dataset.src; hv.play().catch(function () {}); }

  // reel cards: autoplay muted while in view on touch, on hover with a mouse
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  function start(card) {
    var v = card.querySelector('video');
    if (!v.src) v.src = v.dataset.src;
    v.play().then(function () { card.classList.add('playing'); }).catch(function () {});
  }
  function stop(card) { var v = card.querySelector('video'); v.pause(); card.classList.remove('playing'); }
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (fine) { var v = e.target.querySelector('video'); if (e.isIntersecting && !v.src) { v.src = v.dataset.src; v.preload = 'metadata'; } return; }
        if (e.intersectionRatio > 0.6) start(e.target); else stop(e.target);
      });
    }, { threshold: [0, 0.6] });
    cards.forEach(function (c) { io.observe(c); });
  }
  if (fine) cards.forEach(function (c) {
    c.addEventListener('mouseenter', function () { if (!reduce) start(c); });
    c.addEventListener('mouseleave', function () { stop(c); });
  });

  // lightbox
  var lb = document.getElementById('lb'), lv = document.getElementById('lbVideo'), cap = document.getElementById('lbCap');
  var lastFocus = null;
  function open(card) {
    lastFocus = document.activeElement;
    lv.src = card.dataset.src;
    cap.textContent = card.dataset.title + '  for  ' + card.dataset.brand + '  (spec)';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lv.muted = false;
    lv.play().catch(function () {});
    document.getElementById('lbClose').focus();
  }
  function close() {
    lv.pause(); lv.removeAttribute('src'); lv.load();
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  cards.forEach(function (c) { c.addEventListener('click', function () { open(c); }); });
  document.getElementById('lbClose').addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });

  // "Watch" links in the formats section open that film
  Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('data-open');
      var card = cards.filter(function (c) { return c.dataset.src.indexOf(id) !== -1; })[0];
      if (card) { e.preventDefault(); open(card); }
    });
  });

  // reel arrows
  var reel = document.getElementById('reel');
  function nudge(d) {
    var w = reel.querySelector('.card').getBoundingClientRect().width + 14;
    reel.scrollBy({ left: d * w * 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.getElementById('prev').addEventListener('click', function () { nudge(-1); });
  document.getElementById('next').addEventListener('click', function () { nudge(1); });

  // copy email
  var cb = document.getElementById('copy'), em = document.getElementById('email');
  cb.addEventListener('click', function () {
    var done = function () { cb.textContent = 'Copied'; setTimeout(function () { cb.textContent = 'Copy'; }, 1600); };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents(em);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      cb.textContent = 'Selected'; setTimeout(function () { cb.textContent = 'Copy'; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(em.textContent).then(done, fallback);
    else fallback();
  });

  // brief form: compose an email in the visitor's mail app
  var form = document.getElementById('brief'), err = document.getElementById('briefErr');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), brand = f.brand.value.trim(), link = f.link.value.trim();
    if (!name) { err.textContent = 'Add your name so we know who to reply to.'; f.name.focus(); return; }
    if (!link && !brand) { err.textContent = 'Add your brand or a link to the product.'; f.link.focus(); return; }
    err.textContent = '';
    var subject = (f.want.value === 'A free spec ad' ? 'Free spec ad' : f.want.value) + (brand ? ' for ' + brand : '');
    var body = [
      'Hi Scintova,', '',
      'Name: ' + name,
      'Brand: ' + (brand || '-'),
      'Product: ' + (link || '-'),
      "What I'd like: " + f.want.value,
      'What we can and can\'t claim: ' + (f.notes.value.trim() || '-'), '',
      'Photos attached.'
    ].join('\n');
    window.location.href = 'mailto:hello@scintova.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
