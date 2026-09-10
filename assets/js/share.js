/* ============================================================
   星哥内部图书馆 · 分享面板
   ------------------------------------------------------------
   大厂通用做法：
   ① 手机浏览器支持 navigator.share → 直接调系统分享
      （弹出的就是 微信/朋友圈/QQ/小红书/抖音… 全部已装 App）
   ② 不支持（桌面浏览器 / 微信内置）→ 弹出自家面板：
      微信/朋友圈 = 二维码（手机扫开再转）
      QQ / 微博   = 官方网页分享接口
      小红书/抖音 = 无网页接口 → 复制链接 + 去 App 粘贴引导
   重写 window.xgShare：点「分享」按钮即弹面板
   ============================================================ */
(function () {
  'use strict';

  var PAGE_URL = location.href;
  var BOOK_TITLE = (document.title || '').split('·')[0].trim() || '星哥内部著作';
  var SHARE_TEXT = BOOK_TITLE + '（星哥内部著作 · 全本免费阅读）';

  /* ---------- 工具 ---------- */
  function track(name) { if (window.xgTrack) { try { window.xgTrack(name); } catch (e) {} } }

  function copyLink(cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(PAGE_URL).then(function () { cb(true); }, function () { legacyCopy(cb); });
    } else legacyCopy(cb);
  }
  function legacyCopy(cb) {
    try {
      var ta = document.createElement('textarea');
      ta.value = PAGE_URL;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      cb(!!ok);
    } catch (e) { cb(false); }
  }

  var toastEl = null, toastTk = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:12%;transform:translateX(-50%);z-index:10001;background:#e8b04b;color:#16130f;font-weight:700;font-size:13px;padding:10px 18px;border-radius:99px;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:82vw;text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastTk);
    toastTk = setTimeout(function () { toastEl.style.display = 'none'; }, 2200);
  }

  /* ---------- 面板 ---------- */
  var ov = null, qrMade = false, qrImgHTML = '';

  /* 二维码库按需加载（share.js 与 qrcode.min.js 同目录） */
  var BASE = '';
  try {
    if (document.currentScript && document.currentScript.src) {
      BASE = document.currentScript.src.replace(/share\.js(\?.*)?$/, '');
    }
  } catch (e) {}

  function ensureQR(cb) {
    if (window.qrcode) return cb(true);
    if (!BASE) return cb(false);
    var s = document.createElement('script');
    s.src = BASE + 'qrcode.min.js';
    s.onload = function () { cb(!!window.qrcode); };
    s.onerror = function () { cb(false); };
    (document.head || document.documentElement).appendChild(s);
  }

  function makeQR() {
    try {
      var qr = window.qrcode(0, 'M');
      qr.addData(PAGE_URL);
      qr.make();
      qrImgHTML = qr.createImgTag(5, 12);
    } catch (e) { qrImgHTML = ''; }
    return qrImgHTML;
  }

  function closePanel() { if (ov) { ov.remove(); ov = null; } }

  function showQR(kindName) {
    var box = ov.querySelector('.xgsp-grid');
    box.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#a2968a;font-size:12px;padding:24px 0">二维码生成中…</div>';
    box.style.gridTemplateColumns = '1fr';
    ensureQR(function (ok) {
      if (!ov) return;
      var qr = ok ? makeQR() : '';
      box.innerHTML =
        '<div style="grid-column:1/-1;text-align:center">' +
        '<div style="font-size:14px;font-weight:800;color:#f0e9de;margin-bottom:4px">' + kindName + ' · 扫一扫</div>' +
        '<div style="font-size:12px;color:#a2968a;margin-bottom:14px">手机' + (kindName.indexOf('朋友圈') > -1 ? '微信扫码' : '微信/QQ 扫码') +
        '打开本书 → 右上角 ··· 转发给朋友或分享到朋友圈</div>' +
        (qr ? qr.replace('<img', '<img style="width:196px;height:196px;background:#fff;padding:8px;border-radius:10px;image-rendering:pixelated"') :
          '<div style="color:#e8b04b;padding:20px">二维码生成失败，请返回用「复制链接」</div>') +
        '<button class="xgsp-back" style="margin-top:14px;background:#332c24;color:#a2968a;border:none;padding:8px 22px;border-radius:99px;font-size:12.5px;font-weight:700;cursor:pointer">← 返回其他分享方式</button>' +
        '</div>';
      var back = box.querySelector('.xgsp-back');
      back.onclick = function () {
        closePanel();
        openPanel();
      };
    });
  }

  function backToGrid() {
    if (!ov) return;
    closePanel();
    openPanel();
  }

  function item(icon, label, hint, onClick) {
    var d = document.createElement('button');
    d.className = 'xgsp-it';
    d.style.cssText = 'background:none;border:none;padding:10px 2px;border-radius:10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px';
    d.innerHTML = '<span style="width:46px;height:46px;border-radius:12px;background:#332c24;display:flex;align-items:center;justify-content:center;font-size:22px">' + icon + '</span>' +
      '<span style="font-size:12px;color:#f0e9de;font-weight:700">' + label + '</span>' +
      (hint ? '<span style="font-size:10px;color:#8a7f70;line-height:1.3">' + hint + '</span>' : '');
    d.onclick = onClick;
    return d;
  }

  function openWebShare(url) { window.open(url, '_blank', 'noopener'); }

  function openPanel() {
    if (ov) return;
    track('share.panel.open');
    ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center';
    ov.onclick = function (e) { if (e.target === ov) closePanel(); };

    var sheet = document.createElement('div');
    sheet.style.cssText = 'width:100%;max-width:420px;background:#1f1b16;border:1px solid #332c24;border-bottom:none;border-radius:18px 18px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom))';
    ov.appendChild(sheet);

    /* 头部 */
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px';
    head.innerHTML = '<div style="min-width:0"><div style="font-size:15px;font-weight:800;color:#f0e9de">分享这本书</div>' +
      '<div style="font-size:11.5px;color:#8a7f70;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + BOOK_TITLE + ' · 全本免费</div></div>';
    var x = document.createElement('button');
    x.textContent = '✕';
    x.style.cssText = 'flex:none;background:#332c24;color:#a2968a;border:none;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:14px';
    x.onclick = closePanel;
    head.appendChild(x);
    sheet.appendChild(head);

    /* 宫格 */
    var grid = document.createElement('div');
    grid.className = 'xgsp-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px';
    sheet.appendChild(grid);

    if (navigator.share) {
      grid.appendChild(item('📤', '更多方式', '微信/QQ/抖音', function () {
        track('share.to.system');
        navigator.share({ title: SHARE_TEXT, text: SHARE_TEXT, url: PAGE_URL }).catch(function () {});
        closePanel();
      }));
    }
    grid.appendChild(item('💬', '微信', '扫码转发', function () { track('share.to.wechat'); showQR('微信'); }));
    grid.appendChild(item('🌆', '朋友圈', '扫码后分享', function () { track('share.to.moments'); showQR('朋友圈'); }));
    grid.appendChild(item('🐧', 'QQ好友', '', function () {
      track('share.to.qq');
      openWebShare('https://connect.qq.com/widget/shareqq/index.html?url=' + encodeURIComponent(PAGE_URL) + '&title=' + encodeURIComponent(SHARE_TEXT));
      closePanel();
    }));
    grid.appendChild(item('📢', '微博', '', function () {
      track('share.to.weibo');
      openWebShare('https://service.weibo.com/share/share.php?url=' + encodeURIComponent(PAGE_URL) + '&title=' + encodeURIComponent(SHARE_TEXT));
      closePanel();
    }));
    grid.appendChild(item('📕', '小红书', '复制去粘贴', function () {
      track('share.to.xhs');
      copyLink(function () { closePanel(); toast('链接已复制 · 打开小红书，粘贴到笔记或发给朋友'); });
    }));
    grid.appendChild(item('🎵', '抖音', '复制去粘贴', function () {
      track('share.to.dy');
      copyLink(function () { closePanel(); toast('链接已复制 · 打开抖音，粘贴到评论区或私信'); });
    }));
    grid.appendChild(item('🔗', '复制链接', '', function () {
      track('share.to.copy');
      copyLink(function (ok) { closePanel(); toast(ok ? '链接已复制，直接粘贴发给朋友' : '复制失败，请长按地址栏复制'); });
    }));

    /* 底部说明 */
    var tip = document.createElement('div');
    tip.style.cssText = 'margin-top:14px;font-size:11px;color:#8a7f70;text-align:center;line-height:1.6';
    tip.textContent = '手机上选「更多方式」会弹出系统分享，微信、朋友圈、QQ、小红书、抖音一次全到位';
    sheet.appendChild(tip);

    document.body.appendChild(ov);
  }

  /* 接管阅读页「分享」按钮（覆盖旧的复制式实现） */
  window.xgShare = function () { openPanel(); };
})();
