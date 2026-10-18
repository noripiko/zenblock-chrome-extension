import JSZip from 'jszip';
import { ExtensionConfig } from '../types/extension';

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  isBinary?: boolean;
}

// Generates an SVG icon as string
export function generateIconSvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="zenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#zenGrad)" />
  <!-- Shield & Lotus / Zen Circle -->
  <path d="M64 22 L98 34 V62 C98 84 83 102 64 108 C45 102 30 84 30 62 V34 Z" fill="none" stroke="#ffffff" stroke-width="7" stroke-linejoin="round" />
  <circle cx="64" cy="62" r="14" fill="#ffffff" />
  <path d="M64 42 C56 50 56 62 64 70 C72 62 72 50 64 42 Z" fill="#ffffff" opacity="0.8" />
</svg>`;
}

// Convert SVG to Canvas and extract Base64 PNG
export function createIconPngBlob(size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const svgString = generateIconSvg(size);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
      }
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob || new Blob());
      }, 'image/png');
    };
    img.src = url;
  });
}

export function generateExtensionFiles(config: ExtensionConfig): GeneratedFile[] {
  const activeDomains = config.domains.filter((d) => d.enabled);

  // 1. manifest.json (Manifest V3)
  const manifest = {
    manifest_version: 3,
    name: config.extensionName || 'ZenBlock - SNS誘惑ブロッカー',
    version: config.version || '1.2.0',
    description: config.description || 'SNSの中毒的アクセスを遮断し、マインドフルな深呼吸や誓いの言葉で時間を守る拡張機能',
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    options_page: 'options.html',
    background: {
      service_worker: 'background.js',
    },
    permissions: [
      'storage',
      'alarms',
      'tabs',
      'webNavigation',
    ],
    host_permissions: [
      '<all_urls>',
    ],
    web_accessible_resources: [
      {
        resources: ['blocked.html', 'icons/*'],
        matches: ['<all_urls>'],
      },
    ],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        css: ['content.css'],
        run_at: 'document_start',
      },
    ],
  };

  // 2. background.js
  const backgroundJs = `// ZenBlock Background Service Worker (Manifest V3)
// スマホ（Kiwi/Orion）およびデスクトップ（Chrome/Edge/Brave）対応

const DEFAULT_CONFIG = ${JSON.stringify(config, null, 2)};

// 初期化
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(['zenConfig', 'zenStats', 'unlockedPasses']);
  if (!stored.zenConfig) {
    await chrome.storage.local.set({
      zenConfig: DEFAULT_CONFIG,
      zenStats: {
        blocksToday: 0,
        totalBlocks: 0,
        minutesSaved: 0,
        lastResetDate: new Date().toDateString(),
      },
      unlockedPasses: {},
    });
  }
  console.log('ZenBlock initialized successfully.');
});

// スケジュール判定関数
function isWithinSchedule(cfg) {
  if (!cfg.scheduleEnabled) return true;
  const now = new Date();
  const day = now.getDay();
  if (!cfg.scheduleDays.includes(day)) return false;

  const [startH, startM] = cfg.scheduleStart.split(':').map(Number);
  const [endH, endM] = cfg.scheduleEnd.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// ドメイン一致チェック
function findMatchingRule(urlStr, cfg) {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();
    
    // 拡張機能自身のページはブロックしない
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
      return null;
    }

    for (const item of cfg.domains) {
      if (!item.enabled) continue;
      const target = item.domain.toLowerCase().trim();
      if (hostname === target || hostname.endsWith('.' + target)) {
        return item;
      }
    }
  } catch (e) {
    // invalid URL
  }
  return null;
}

// webNavigation でドメイン遷移をインターセプト
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // トップフレームのみ
  
  const data = await chrome.storage.local.get(['zenConfig', 'unlockedPasses', 'zenStats']);
  const cfg = data.zenConfig || DEFAULT_CONFIG;
  const passes = data.unlockedPasses || {};
  const stats = data.zenStats || { blocksToday: 0, totalBlocks: 0, minutesSaved: 0 };

  const matchedRule = findMatchingRule(details.url, cfg);
  if (!matchedRule) return;

  // スケジュール外ならブロックしない
  if (!isWithinSchedule(cfg)) return;

  // 一時解除パスが有効なら通す
  const passExpiry = passes[matchedRule.domain];
  if (passExpiry && Date.now() < passExpiry) {
    return;
  }

  // 警告バーモードの場合は content_script に任せる（リダイレクトしない）
  if (matchedRule.blockMode === 'warning_bar') {
    return;
  }

  // 遮断画面へリダイレクト
  const blockedPageUrl = chrome.runtime.getURL('blocked.html') + 
    '?domain=' + encodeURIComponent(matchedRule.domain) +
    '&name=' + encodeURIComponent(matchedRule.name) +
    '&mode=' + encodeURIComponent(matchedRule.blockMode) +
    '&origUrl=' + encodeURIComponent(details.url);

  // 統計更新
  stats.blocksToday = (stats.blocksToday || 0) + 1;
  stats.totalBlocks = (stats.totalBlocks || 0) + 1;
  stats.minutesSaved = (stats.minutesSaved || 0) + 15; // 1回の誘惑回避で約15分節約換算
  await chrome.storage.local.set({ zenStats: stats });

  chrome.tabs.update(details.tabId, { url: blockedPageUrl });
});

// メッセージハンドラー（一時解除リクエストや設定保存）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TEMP_UNLOCK') {
    const domain = request.domain;
    const durationMinutes = request.minutes || 5;
    chrome.storage.local.get(['unlockedPasses'], (res) => {
      const passes = res.unlockedPasses || {};
      passes[domain] = Date.now() + durationMinutes * 60 * 1000;
      chrome.storage.local.set({ unlockedPasses: passes }, () => {
        sendResponse({ success: true, expiry: passes[domain] });
      });
    });
    return true;
  }

  if (request.action === 'GET_CONFIG') {
    chrome.storage.local.get(['zenConfig', 'zenStats'], (res) => {
      sendResponse(res);
    });
    return true;
  }
});
`;

  // 3. content.js (Warning Bar and In-Page Overlay)
  const contentJs = `// ZenBlock Content Script
(async function() {
  try {
    const res = await chrome.storage.local.get(['zenConfig', 'unlockedPasses']);
    const cfg = res.zenConfig;
    if (!cfg) return;

    const hostname = window.location.hostname.toLowerCase();
    const matched = cfg.domains.find(d => d.enabled && (hostname === d.domain.toLowerCase() || hostname.endsWith('.' + d.domain.toLowerCase())));

    if (!matched) return;

    // 警告バーモードの処理
    if (matched.blockMode === 'warning_bar') {
      injectWarningBanner(matched, cfg);
    }
  } catch (e) {
    console.error('ZenBlock content script error:', e);
  }

  function injectWarningBanner(item, cfg) {
    if (document.getElementById('zenblock-warning-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'zenblock-warning-banner';
    banner.innerHTML = \`
      <div class="zenblock-banner-content">
        <div class="zenblock-badge">🧘 ZenBlock 警告</div>
        <div class="zenblock-msg">
          <strong>\${item.name}</strong> を閲覧中。無意識のダラダラ見に注意！目的が終わったら閉じましょう。
        </div>
        <div class="zenblock-timer" id="zenblock-elapsed">閲覧時間: 00:00</div>
        <button id="zenblock-close-tab-btn" class="zenblock-btn-danger">タブを閉じる</button>
        <button id="zenblock-dismiss-btn" class="zenblock-btn-subtle" title="バーを最小化">✕</button>
      </div>
    \`;

    document.documentElement.appendChild(banner);

    // 経過時間タイマー
    let seconds = 0;
    const timerElem = document.getElementById('zenblock-elapsed');
    setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      if (timerElem) timerElem.textContent = '閲覧時間: ' + m + ':' + s;
    }, 1000);

    // タブ閉じボタン
    document.getElementById('zenblock-close-tab-btn')?.addEventListener('click', () => {
      window.close();
      window.location.href = 'about:blank';
    });

    // 閉じる・最小化
    document.getElementById('zenblock-dismiss-btn')?.addEventListener('click', () => {
      banner.style.transform = 'translateY(-100%)';
    });
  }
})();
`;

  // 4. content.css
  const contentCss = `/* ZenBlock Warning Banner Styles */
#zenblock-warning-banner {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  z-index: 2147483647 !important;
  background: linear-gradient(135deg, #1e1b4b, #312e81) !important;
  color: #ffffff !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif !important;
  font-size: 14px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  border-bottom: 2px solid #6366f1 !important;
  padding: 10px 16px !important;
  transition: transform 0.3s ease !important;
  box-sizing: border-box !important;
}

.zenblock-banner-content {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
}

.zenblock-badge {
  background: #4f46e5 !important;
  color: #fff !important;
  padding: 3px 10px !important;
  border-radius: 9999px !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  letter-spacing: 0.05em !important;
}

.zenblock-msg {
  flex: 1 !important;
  color: #e0e7ff !important;
  font-size: 13px !important;
}

.zenblock-timer {
  background: rgba(0, 0, 0, 0.3) !important;
  padding: 4px 10px !important;
  border-radius: 6px !important;
  font-family: monospace !important;
  font-weight: 700 !important;
  color: #fbbf24 !important;
}

.zenblock-btn-danger {
  background: #dc2626 !important;
  color: white !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 6px 14px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
}
.zenblock-btn-danger:hover {
  background: #b91c1c !important;
}

.zenblock-btn-subtle {
  background: transparent !important;
  color: #a5b4fc !important;
  border: none !important;
  cursor: pointer !important;
  font-size: 16px !important;
  padding: 4px 8px !important;
}
.zenblock-btn-subtle:hover {
  color: #fff !important;
}
`;

  // 5. blocked.html (Intervention screen)
  const blockedHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZenBlock - 一息つきましょう</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(30, 41, 59, 0.7);
      --primary: #6366f1;
      --primary-light: #818cf8;
      --accent: #06b6d4;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow-x: hidden;
    }
    /* Animated Zen background aura */
    .zen-aura {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 0;
      animation: pulseGlow 6s infinite alternate ease-in-out;
    }
    @keyframes pulseGlow {
      0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
      100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
    }
    .card {
      position: relative;
      z-index: 1;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #c7d2fe;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .site-target {
      color: #38bdf8;
      font-weight: 700;
      word-break: break-all;
    }
    .subtext {
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    /* Breathing animation circle */
    .breath-box {
      margin: 20px auto 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .breath-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, #6366f1, #06b6d4, #6366f1);
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: breatheAnim 8s infinite ease-in-out;
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
    }
    .breath-inner {
      width: 100%;
      height: 100%;
      background: #0f172a;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .breath-status {
      font-size: 14px;
      font-weight: 700;
      color: #a5b4fc;
      margin-bottom: 4px;
    }
    .breath-timer {
      font-size: 32px;
      font-weight: 800;
      font-family: monospace;
      color: #fff;
    }
    @keyframes breatheAnim {
      0%, 100% { transform: scale(0.9); }
      50% { transform: scale(1.18); box-shadow: 0 0 50px rgba(6, 182, 212, 0.6); }
    }
    /* Challenge box for typing / math */
    .challenge-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: left;
    }
    .challenge-title {
      font-size: 13px;
      font-weight: 700;
      color: #c7d2fe;
      margin-bottom: 8px;
    }
    .pledge-prompt {
      font-size: 14px;
      color: #cbd5e1;
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 14px;
      border-radius: 8px;
      user-select: none;
      margin-bottom: 12px;
      border-left: 3px solid #6366f1;
    }
    input[type="text"] {
      width: 100%;
      padding: 12px 14px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border 0.2s;
    }
    input[type="text"]:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }
    .btn-disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
    .quote-box {
      margin-top: 24px;
      font-style: italic;
      color: #94a3b8;
      font-size: 13px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="zen-aura"></div>
  <div class="card">
    <div class="logo-badge">
      <span>🛡️</span> ZenBlock 遮断ガード
    </div>
    <h1 id="title-text">少し立ち止まりましょう</h1>
    <p class="subtext">
      <span class="site-target" id="target-domain">SNS</span> へアクセスしようとしました。<br>
      このアクセスは本当に今、必要ですか？
    </p>

    <!-- 1. 呼吸待機モード -->
    <div id="mode-breath" class="breath-box" style="display: none;">
      <div class="breath-circle">
        <div class="breath-inner">
          <div class="breath-status" id="breath-label">息を吸って...</div>
          <div class="breath-timer" id="breath-countdown">30</div>
        </div>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">
        ドーパミンの衝動が収まるまで、ゆっくり深呼吸しましょう。
      </p>
    </div>

    <!-- 2. タイピング宣誓モード -->
    <div id="mode-pledge" class="challenge-box" style="display: none;">
      <div class="challenge-title">✍️ 誓いの言葉を入力して解除（5分間のみ）</div>
      <div class="pledge-prompt" id="pledge-target-text">私の時間は有限です。無目的な閲覧をやめて本来の目標に集中します。</div>
      <input type="text" id="pledge-input" placeholder="上記の文章を正確に入力してください..." autocomplete="off">
    </div>

    <!-- 3. 計算チャレンジモード -->
    <div id="mode-math" class="challenge-box" style="display: none;">
      <div class="challenge-title">🧠 前頭葉を覚醒させる計算クイズ</div>
      <p style="font-size: 18px; font-weight: 800; color: #38bdf8; margin: 10px 0;" id="math-problem">47 + 38 = ?</p>
      <input type="text" id="math-input" placeholder="答えを入力..." autocomplete="off">
    </div>

    <!-- 4. 厳格モード（解除不可） -->
    <div id="mode-strict" class="challenge-box" style="display: none; text-align: center;">
      <p style="font-size: 15px; color: #f87171; font-weight: 700; margin-bottom: 6px;">⛔ 厳格遮断モードが有効です</p>
      <p style="font-size: 13px; color: #cbd5e1;">このサイトは設定により閲覧が禁止されています。目標に向かって集中を続けましょう。</p>
    </div>

    <!-- ボタン操作 -->
    <div class="actions">
      <button class="btn btn-secondary" id="btn-close-tab">
        ✕ 誘惑に打ち勝ち、タブを閉じる
      </button>
      <button class="btn btn-primary btn-disabled" id="btn-unlock" style="display: none;">
        🔓 5分間だけ一時許可して進む
      </button>
    </div>

    <div class="quote-box" id="quote-text">
      「本当に大切なことは、SNSの向こうではなく目の前の現実にある。」
    </div>
  </div>

  <script src="blocked.js"></script>
</body>
</html>
`;

  // 6. blocked.js
  const blockedJs = `// ZenBlock Blocked Page Controller
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain') || 'SNSサイト';
  const name = urlParams.get('name') || domain;
  const mode = urlParams.get('mode') || 'breath';
  const origUrl = urlParams.get('origUrl') || 'https://' + domain;

  document.getElementById('target-domain').textContent = name + ' (' + domain + ')';

  // モード別表示制御
  const breathSection = document.getElementById('mode-breath');
  const pledgeSection = document.getElementById('mode-pledge');
  const mathSection = document.getElementById('mode-math');
  const strictSection = document.getElementById('mode-strict');
  const unlockBtn = document.getElementById('btn-unlock');
  const closeBtn = document.getElementById('btn-close-tab');

  if (mode === 'breath') {
    breathSection.style.display = 'flex';
    unlockBtn.style.display = 'flex';
    startBreathTimer(30);
  } else if (mode === 'pledge') {
    pledgeSection.style.display = 'block';
    unlockBtn.style.display = 'flex';
    setupPledgeChallenge();
  } else if (mode === 'math') {
    mathSection.style.display = 'block';
    unlockBtn.style.display = 'flex';
    setupMathChallenge();
  } else {
    // strict
    strictSection.style.display = 'block';
    unlockBtn.style.display = 'none';
  }

  // タブを閉じる
  closeBtn.addEventListener('click', () => {
    window.close();
    // もしwindow.close()がブロックされた場合の代替遷移
    window.location.href = 'about:blank';
  });

  // 解除ボタン
  unlockBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'TEMP_UNLOCK',
      domain: domain,
      minutes: 5
    }, (res) => {
      window.location.href = origUrl;
    });
  });

  // 呼吸タイマーロジック
  function startBreathTimer(initialSeconds) {
    let timeLeft = initialSeconds;
    const countdownEl = document.getElementById('breath-countdown');
    const labelEl = document.getElementById('breath-label');

    const interval = setInterval(() => {
      timeLeft--;
      if (countdownEl) countdownEl.textContent = timeLeft;

      // 吸って・吐いてのガイド（8秒周期）
      const cycle = timeLeft % 8;
      if (cycle >= 4) {
        if (labelEl) labelEl.textContent = '息を吸って...';
      } else {
        if (labelEl) labelEl.textContent = 'ゆっくり吐いて...';
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        if (labelEl) labelEl.textContent = '準備完了';
        unlockBtn.classList.remove('btn-disabled');
        unlockBtn.innerHTML = '🔓 5分間だけ一時許可して閲覧する';
      }
    }, 1000);
  }

  // 宣誓タイピングロジック
  function setupPledgeChallenge() {
    const targetTextEl = document.getElementById('pledge-target-text');
    const inputEl = document.getElementById('pledge-input');
    const targetText = targetTextEl.textContent.trim();

    inputEl.addEventListener('input', () => {
      if (inputEl.value.trim() === targetText) {
        unlockBtn.classList.remove('btn-disabled');
        unlockBtn.innerHTML = '✨ 宣誓完了！5分間閲覧する';
      } else {
        unlockBtn.classList.add('btn-disabled');
      }
    });
  }

  // 計算チャレンジロジック
  function setupMathChallenge() {
    const problems = [
      { q: '47 + 38 = ?', a: 85 },
      { q: '12 × 7 = ?', a: 84 },
      { q: '93 - 48 = ?', a: 45 },
      { q: '64 ÷ 4 = ?', a: 16 }
    ];
    const item = problems[Math.floor(Math.random() * problems.length)];
    document.getElementById('math-problem').textContent = item.q;
    const mathInput = document.getElementById('math-input');

    mathInput.addEventListener('input', () => {
      if (parseInt(mathInput.value, 10) === item.a) {
        unlockBtn.classList.remove('btn-disabled');
        unlockBtn.innerHTML = '🎉 正解！5分間だけ閲覧する';
      } else {
        unlockBtn.classList.add('btn-disabled');
      }
    });
  }
});
`;

  // 7. popup.html
  const popupHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ZenBlock</title>
  <style>
    body {
      width: 320px;
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
      background: #0f172a;
      color: #f8fafc;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stats-card {
      background: #1e293b;
      border-radius: 12px;
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
      text-align: center;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 800;
      color: #38bdf8;
    }
    .stat-lbl {
      font-size: 11px;
      color: #94a3b8;
    }
    .btn {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      margin-bottom: 8px;
    }
    .btn-quick-add {
      background: #6366f1;
      color: white;
    }
    .btn-options {
      background: #334155;
      color: #e2e8f0;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .current-site {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🧘 ZenBlock</div>
    <span style="font-size: 11px; background: #059669; padding: 2px 8px; border-radius: 9999px;">保護中</span>
  </div>

  <div class="current-site" id="current-url">読み込み中...</div>

  <div class="stats-card">
    <div>
      <div class="stat-val" id="stat-blocks">0</div>
      <div class="stat-lbl">本日の遮断回数</div>
    </div>
    <div>
      <div class="stat-val" id="stat-time">0分</div>
      <div class="stat-lbl">節約できた時間</div>
    </div>
  </div>

  <button class="btn btn-quick-add" id="btn-block-current">
    ＋ このサイトをブロックに追加
  </button>
  <button class="btn btn-options" id="btn-open-options">
    ⚙️ 設定・ドメイン管理を開く
  </button>

  <script src="popup.js"></script>
</body>
</html>
`;

  // 8. popup.js
  const popupJs = `// ZenBlock Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  // 統計情報読み込み
  chrome.storage.local.get(['zenStats', 'zenConfig'], (res) => {
    const stats = res.zenStats || { blocksToday: 0, minutesSaved: 0 };
    document.getElementById('stat-blocks').textContent = stats.blocksToday || 0;
    document.getElementById('stat-time').textContent = (stats.minutesSaved || 0) + '分';
  });

  // 現在のタブのURL取得
  let currentHostname = '';
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        currentHostname = url.hostname;
        document.getElementById('current-url').textContent = '現在のページ: ' + currentHostname;
      } catch (e) {
        document.getElementById('current-url').textContent = '現在のページ: 取得不可';
      }
    }
  });

  // 現在のサイトを追加
  document.getElementById('btn-block-current')?.addEventListener('click', () => {
    if (!currentHostname) return;
    chrome.storage.local.get(['zenConfig'], (res) => {
      const cfg = res.zenConfig || DEFAULT_CONFIG;
      if (!cfg.domains.some(d => d.domain === currentHostname)) {
        cfg.domains.push({
          id: 'custom-' + Date.now(),
          domain: currentHostname,
          name: currentHostname,
          category: 'custom',
          enabled: true,
          blockMode: 'breath',
          iconName: 'globe'
        });
        chrome.storage.local.set({ zenConfig: cfg }, () => {
          alert(currentHostname + ' をブロック対象に追加しました！');
        });
      } else {
        alert(currentHostname + ' は既に対象に含まれています。');
      }
    });
  });

  // 設定画面を開く
  document.getElementById('btn-open-options')?.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
});
`;

  // 9. options.html
  const optionsHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ZenBlock 設定</title>
  <style>
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .card { background: #1e293b; border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.08); }
    h2 { font-size: 16px; margin-bottom: 14px; color: #38bdf8; }
    .domain-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .btn { background: #6366f1; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .input { background: #0f172a; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>🛡️ ZenBlock 設定＆遮断ドメイン管理</h1>
  <div class="card">
    <h2>登録中のブロック対象ドメイン</h2>
    <div id="domain-list">読み込み中...</div>
  </div>
  <div class="card">
    <h2>スマホでの利用について</h2>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
      Androidをお使いの方は <strong>Kiwi Browser</strong> または <strong>Lemur Browser</strong> にこの拡張機能をインストールすることで、スマホのブラウザでも同一のSNS遮断機能を利用できます。<br>
      iOSをお使いの方は <strong>Orion Browser</strong> をご利用ください。
    </p>
  </div>
  <script src="options.js"></script>
</body>
</html>
`;

  // 10. options.js
  const optionsJs = `// ZenBlock Options Script
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['zenConfig'], (res) => {
    const cfg = res.zenConfig;
    if (!cfg) return;
    const listEl = document.getElementById('domain-list');
    listEl.innerHTML = cfg.domains.map(d => \`
      <div class="domain-row">
        <div>
          <strong>\${d.name}</strong> (\${d.domain})
          <div style="font-size: 12px; color: #94a3b8;">モード: \${d.blockMode}</div>
        </div>
        <span style="color: \${d.enabled ? '#34d399' : '#94a3b8'}; font-weight: 600;">
          \${d.enabled ? '有効' : '無効'}
        </span>
      </div>
    \`).join('');
  });
});
`;

  // 11. README.md
  const readmeMd = `# ZenBlock - SNS誘惑ブロッカー（Chrome拡張機能＆スマホ対応）

SNS（X/Twitter, Instagram, YouTube, TikTokなど）の無意識スクロールや中毒的アクセスを未然に防ぎ、マインドフルな深呼吸や宣誓タイピングで自分の時間を取り戻す拡張機能です。

---

## 💻 パソコン（Chrome / Edge / Brave / Arc）での導入方法

1. ダウンロードした \`zenblock-extension.zip\` を任意のフォルダに解凍（展開）します。
2. Google Chrome（またはEdge/Brave）を開き、アドレスバーに以下を入力してEnterを押します：
   \`\`\`
   chrome://extensions
   \`\`\`
3. 画面右上にある **「デベロッパー モード」** のトグルスイッチを **ON** にします。
4. 画面左上に表示される **「パッケージ化されていない拡張機能を読み込む」** ボタンをクリックします。
5. 手順1で解凍したフォルダ（\`manifest.json\` が入っているフォルダ）を選択します。
6. インストール完了！設定したSNS（x.comやinstagram.comなど）を開くと、自動でブロック＆警告画面が表示されます。

---

## 📱 スマートフォン（Android / iPhone）での導入方法

スマホの標準Chromeはセキュリティ仕様により直接拡張機能をサポートしていませんが、**以下の方法でスマホでも全く同じように動作します**：

### 【Androidの場合】
1. Google Playストアから **「Kiwi Browser」** または **「Lemur Browser」** を無料インストールします（どちらもChromiumベースでChrome拡張機能が動くブラウザです）。
2. スマホで解凍した本フォルダを保存するか、Kiwi Browserの拡張機能メニュー（\`chrome://extensions\`）を開きます。
3. デベロッパーモードをONにし、**「(from .zip/.crx/.user.js)」** または解凍フォルダを読み込みます。
4. Kiwi BrowserでXやYouTubeを開くと、スマホ画面でも完全に遮断＆深呼吸タイマーが動作します！

### 【iPhone / iPad (iOS) の場合】
1. App Storeから **「Orion Browser by Kagi」**（Chrome拡張機能とFirefoxアドオンがそのまま動く先進的ブラウザ）をインストールします。
2. Orionの設定 > 拡張機能から本拡張機能を読み込みます。
3. さらに確実に対策したい場合は、iPhone標準機能の **「設定」>「スクリーンタイム」>「休止時間」および「アプリ使用時間の制限」** との併用が最も効果的です。

---

## 🧘 提供される遮断モード
- **30秒の深呼吸・マインドフル待機 (Breath)**: ドーパミンの衝動が落ち着くまで深呼吸を促します。
- **戒めの言葉タイピング (Pledge)**: 「私の時間は有限です」等の宣誓文を入力しないと開きません。
- **前頭葉覚醒・計算クイズ (Math)**: 簡単な計算を解くことで衝動的思考から論理的思考へ切り替えます。
- **厳格遮断 (Strict)**: 閲覧を一切許可せず、戻るボタンのみ提供します。
- **上部警告バナー (Warning Bar)**: ページ上部に閲覧経過時間タイマーと警告バーを表示します。
`;

  return [
    { name: 'manifest.json', path: 'manifest.json', content: JSON.stringify(manifest, null, 2) },
    { name: 'background.js', path: 'background.js', content: backgroundJs },
    { name: 'content.js', path: 'content.js', content: contentJs },
    { name: 'content.css', path: 'content.css', content: contentCss },
    { name: 'blocked.html', path: 'blocked.html', content: blockedHtml },
    { name: 'blocked.js', path: 'blocked.js', content: blockedJs },
    { name: 'popup.html', path: 'popup.html', content: popupHtml },
    { name: 'popup.js', path: 'popup.js', content: popupJs },
    { name: 'options.html', path: 'options.html', content: optionsHtml },
    { name: 'options.js', path: 'options.js', content: optionsJs },
    { name: 'README.md', path: 'README.md', content: readmeMd },
  ];
}

// Packages all files into a real .ZIP file
export async function downloadExtensionZip(config: ExtensionConfig): Promise<void> {
  const zip = new JSZip();
  const files = generateExtensionFiles(config);

  // Add all text files
  files.forEach((f) => {
    zip.file(f.path, f.content);
  });

  // Create icons folder with PNGs
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    try {
      const blob16 = await createIconPngBlob(16);
      const blob48 = await createIconPngBlob(48);
      const blob128 = await createIconPngBlob(128);

      iconsFolder.file('icon16.png', blob16);
      iconsFolder.file('icon48.png', blob48);
      iconsFolder.file('icon128.png', blob128);
    } catch (e) {
      // Fallback SVG icon if canvas fails
      const svgIcon = generateIconSvg(128);
      iconsFolder.file('icon.svg', svgIcon);
    }
  }

  // Generate zip file and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'zenblock-chrome-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
