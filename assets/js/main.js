/* ============================================================
   星哥 · 一对一陪跑 — 交互脚本
   ============================================================ */

/* ---- 可配置参数：改成你的真实数据 ---- */
var CONFIG = {
  seatsTotal: 200,   // 本月我能亲自跟进的人数上限
  seatsTaken: 137,   // 已跟进人数（请填真实值）
  showBarAfter: 600  // 滚动多少像素后显示移动端底栏
};

(function () {
  'use strict';

  /* ---------- 名额 / 进度条 ---------- */
  function initStock() {
    var total = CONFIG.seatsTotal;
    var taken = Math.min(CONFIG.seatsTaken, total);
    var left = total - taken;

    var elTaken = document.getElementById('taken');
    var elTotal = document.getElementById('total');
    var elLeft = document.getElementById('left');
    var elLeft2 = document.getElementById('left2');
    var bar = document.getElementById('stockbar');

    if (elTaken) elTaken.textContent = taken;
    if (elTotal) elTotal.textContent = total;
    if (elLeft) elLeft.textContent = left;
    if (elLeft2) elLeft2.textContent = left;
    if (bar) {
      setTimeout(function () {
        bar.style.width = Math.round((taken / total) * 100) + '%';
      }, 400);
    }
  }

  /* ---------- 阅读进度条 ---------- */
  function initProgress() {
    var bar = document.getElementById('progress');
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- 导航滚动态 ---------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var mbar = document.getElementById('mbar');
    if (!nav) return;
    function update() {
      var y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle('on', y > 40);
      if (mbar) mbar.classList.toggle('show', y > CONFIG.showBarAfter);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- 滚动进场 ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList && n.classList.contains('reveal');
        });
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 0.09 : 0) + 's';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 数字滚动 ---------- */
  function initCountUp() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    function format(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1500;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + format(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- FAQ 手风琴 ---------- */
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var q = item.querySelector('.faq-q');
      if (!q) return;
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (o) {
          o.classList.remove('open');
          var a = o.querySelector('.faq-a');
          if (a) a.style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          var a = item.querySelector('.faq-a');
          if (a) a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
    window.addEventListener('resize', function () {
      document.querySelectorAll('.faq-item.open .faq-a').forEach(function (a) {
        a.style.maxHeight = a.scrollHeight + 'px';
      });
    });
  }

  /* ---------- 平滑锚点（补偿固定导航高度） ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = window.innerWidth > 820 ? 84 : 20;
        var y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initStock();
    initProgress();
    initNav();
    initReveal();
    initCountUp();
    initFaq();
    initAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
