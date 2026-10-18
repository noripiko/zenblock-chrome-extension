import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Simulator } from './components/Simulator';
import { DomainSettings } from './components/DomainSettings';
import { ExtensionDownloader } from './components/ExtensionDownloader';
import { MobileGuide } from './components/MobileGuide';
import { HabitStats } from './components/HabitStats';
import { DEFAULT_CONFIG } from './data/presetDomains';
import { ExtensionConfig, FocusStats, BlockedDomain } from './types/extension';
import { downloadExtensionZip } from './utils/extensionGenerator';

const STORAGE_KEY_CONFIG = 'zenblock_user_config';
const STORAGE_KEY_STATS = 'zenblock_user_stats';

export default function App() {
  const [config, setConfig] = useState<ExtensionConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  const [stats, setStats] = useState<FocusStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      blocksToday: 4,
      totalBlocks: 27,
      minutesSaved: 60,
      streakDays: 3,
      history: [
        {
          id: 'hist-1',
          domain: 'x.com',
          timestamp: '10分前',
          action: 'resisted',
        },
        {
          id: 'hist-2',
          domain: 'instagram.com',
          timestamp: '1時間前',
          action: 'resisted',
        },
        {
          id: 'hist-3',
          domain: 'youtube.com',
          timestamp: '3時間前',
          action: 'bypassed',
        },
      ],
    };
  });

  const [currentTab, setCurrentTab] = useState<'simulator' | 'settings' | 'export' | 'mobile' | 'stats'>('simulator');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 保存処理
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // トースト表示
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // アクション記録
  const handleRecordAction = (domain: string, action: 'resisted' | 'bypassed') => {
    const newEntry = {
      id: 'hist-' + Date.now(),
      domain,
      timestamp: 'たった今',
      action,
    };

    setStats((prev) => {
      const isResist = action === 'resisted';
      const blocksToday = isResist ? prev.blocksToday + 1 : prev.blocksToday;
      const totalBlocks = isResist ? prev.totalBlocks + 1 : prev.totalBlocks;
      const minutesSaved = isResist ? prev.minutesSaved + 15 : prev.minutesSaved;

      return {
        ...prev,
        blocksToday,
        totalBlocks,
        minutesSaved,
        history: [newEntry, ...prev.history],
      };
    });

    if (action === 'resisted') {
      showToast(`🎉 素晴らしい！「${domain}」の閲覧を我慢し、約15分の時間を守りました！`);
    } else {
      showToast(`⏱️「${domain}」へのアクセスを5分間だけ一時許可しました。`);
    }
  };

  // シミュレーターからドメイン追加
  const handleAddDomainFromSim = (rawDomain: string) => {
    let clean = rawDomain.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) return;

    if (config.domains.some((d) => d.domain.toLowerCase() === clean)) {
      showToast(`「${clean}」は既に登録されています。`);
      return;
    }

    const newDomainItem: BlockedDomain = {
      id: 'custom-' + Date.now(),
      domain: clean,
      name: clean,
      category: 'custom',
      enabled: true,
      blockMode: 'breath',
      iconName: 'globe',
      notes: 'シミュレーターからクイック登録',
    };

    setConfig((prev) => ({
      ...prev,
      domains: [newDomainItem, ...prev.domains],
    }));

    showToast(`🛡️「${clean}」をブロック対象に追加しました！`);
  };

  // 統計リセット
  const handleResetStats = () => {
    if (confirm('統計データと履歴をリセットしますか？')) {
      setStats({
        blocksToday: 0,
        totalBlocks: 0,
        minutesSaved: 0,
        streakDays: 1,
        history: [],
      });
      showToast('統計データをリセットしました。');
    }
  };

  // ヘッダーからのクイックZIPダウンロード
  const handleQuickDownload = async () => {
    try {
      await downloadExtensionZip(config);
      showToast('📦 拡張機能ZIP (zenblock-chrome-extension.zip) のダウンロードを開始しました！');
    } catch (e) {
      alert('ダウンロードに失敗しました。');
    }
  };

  const activeDomainCount = config.domains.filter((d) => d.enabled).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ナビゲーションバー */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickDownload={handleQuickDownload}
        activeDomainCount={activeDomainCount}
      />

      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-indigo-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <span className="text-xl">✨</span>
          <div className="text-xs font-semibold leading-relaxed">{toastMessage}</div>
        </div>
      )}

      {/* メインコンテナ */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'simulator' && (
          <Simulator
            config={config}
            stats={stats}
            onRecordAction={handleRecordAction}
            onAddDomain={handleAddDomainFromSim}
          />
        )}

        {currentTab === 'settings' && (
          <DomainSettings
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {currentTab === 'export' && (
          <ExtensionDownloader config={config} />
        )}

        {currentTab === 'mobile' && (
          <MobileGuide />
        )}

        {currentTab === 'stats' && (
          <HabitStats
            stats={stats}
            onResetStats={handleResetStats}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🧘</span>
            <span className="font-bold text-slate-300">ZenBlock</span>
            <span>— SNSの無意識アクセスを断ち、本来の時間を取り戻す</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Chrome Manifest V3 準拠</span>
            <span>•</span>
            <span>Kiwi Browser / Orion Browser 対応</span>
            <span>•</span>
            <span>完全ローカル動作（プライバシー安全）</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
