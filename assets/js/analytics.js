/* ============================================================
   星哥内部图书馆 · 统计埋点（GoatCounter）
   ------------------------------------------------------------
   · 免费 / 无 Cookie / 不采集个人信息，适配 GitHub Pages
   · 页面浏览：GoatCounter 脚本自动记录
   · 点击事件：凡带 data-xg-track 属性的元素被点击即上报，
     data-xg-info 可附上下文（如书 id）
   · 手动上报：window.xgTrack('event.name', '可选说明')
   · 未配置 window.GOATCOUNTER_CODE（或仍是占位符）时：
     完全静默，零请求、零报错，页面行为不变
   · 调试：URL 加 ?xg_track_test=1 可在控制台看上报日志
   ============================================================ */
(function () {
  'use strict';

  var CODE = String(window.GOATCOUNTER_CODE || '').trim();
  var enabled = !!CODE && CODE !== 'YOUR_GOATCOUNTER_CODE';
  var debug = /[?&]xg_track_test=1/.test(location.search);
  var isReader = /\/books\/b\d+\.html$/.test(location.pathname);
  var queue = [];

  function log(msg, data) {
    if (debug) { try { console.log('[xg-track]', msg, data || ''); } catch (e) {} }
  }

  function send(name, title) {
    log(name, title);
    if (!enabled) return;
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({ event: true, path: name, title: title || '' });
      } else {
        queue.push([name, title]);
      }
    } catch (e) { /* 统计失败绝不影响页面 */ }
  }

  window.xgTrack = send;

  /* ---------- 加载 GoatCounter 主脚本（自动记页面浏览） ---------- */
  if (enabled) {
    var gc = document.createElement('script');
    gc.async = true;
    gc.setAttribute('data-goatcounter', 'https://' + CODE + '.goatcounter.com/count');
    gc.src = 'https://gc.zgo.at/count.js';
    gc.addEventListener('load', function () {
      /* 主脚本就绪后，冲积压的事件队列 */
      setTimeout(function () {
        while (queue.length) { var it = queue.shift(); send(it[0], it[1]); }
      }, 300);
    });
    (document.head || document.documentElement).appendChild(gc);
  }

  /* ---------- 阅读页：给既有元素补标记（不动任何样式/链接） ---------- */
  if (isReader) {
    function mark(sel, name) {
      try {
        var el = document.querySelector(sel);
        if (el && !el.getAttribute('data-xg-track')) el.setAttribute('data-xg-track', name);
      } catch (e) {}
    }
    mark('a[href*="n.wlfx8.cn/362e9f"]', 'reader.cta.link-star');
    mark('a[href="../books.html"]', 'reader.cta.next-book');
    mark('button[onclick^="xgShare"]', 'reader.action.share');
    mark('button[onclick^="xgFont(-1)"]', 'reader.action.font-minus');
    mark('button[onclick^="xgFont(1)"]', 'reader.action.font-plus');

    /* 读完率：滚动 ≥95% 记一次（整会话仅一次） */
    var finished = false;
    window.addEventListener('scroll', function () {
      if (finished) return;
      var h = document.documentElement;
      var mx = h.scrollHeight - h.clientHeight;
      var pct = mx > 0 ? (h.scrollTop || document.body.scrollTop) / mx : 0;
      if (pct >= 0.95) { finished = true; send('reader.finish', document.title); }
    }, { passive: true });
  }

  /* ---------- 书库页：音频播放 / tab 切换（元素存在才绑） ---------- */
  function onPageReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }
  onPageReady(function () {
    var btnPlay = document.getElementById('btnPlay');
    if (btnPlay) btnPlay.addEventListener('click', function () { send('audio.play'); });
    var tB = document.getElementById('tab-books');
    var tA = document.getElementById('tab-audio');
    if (tB) tB.addEventListener('click', function () { send('books.tab.books'); });
    if (tA) tA.addEventListener('click', function () { send('books.tab.audio'); });
  });

  /* ---------- 全站点击代理（捕获阶段，不拦截、不改行为） ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target, tracked = null, anchor = null;
    while (el && el !== document) {
      if (!tracked && el.getAttribute && el.getAttribute('data-xg-track')) tracked = el;
      if (!anchor && el.tagName === 'A' && el.getAttribute('href')) anchor = el;
      el = el.parentNode;
    }
    if (tracked) {
      send(tracked.getAttribute('data-xg-track'), tracked.getAttribute('data-xg-info') || '');
      return;
    }
    /* 兜底：动态生成的触点条（dockbar）链接没有标记也能记到 */
    if (anchor && /n\.wlfx8\.cn/.test(anchor.getAttribute('href'))) {
      if (isReader) send('reader.dock.link-star');
      else if (/books\.html$/.test(location.pathname)) send('cta.books.other-linkstar');
      else send('cta.index.other-linkstar');
    }
  }, true);
})();
