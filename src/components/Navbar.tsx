import React from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Download, 
  Sliders, 
  BarChart3, 
  Sparkles,
  Play
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'simulator' | 'settings' | 'export' | 'mobile' | 'stats';
  onSelectTab: (tab: 'simulator' | 'settings' | 'export' | 'mobile' | 'stats') => void;
  onQuickDownload: () => void;
  activeDomainCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onQuickDownload,
  activeDomainCount,
}) => {
  const tabs = [
    { id: 'simulator', label: 'シミュレーター', icon: Play },
    { id: 'settings', label: `ドメイン設定 (${activeDomainCount})`, icon: Sliders },
    { id: 'export', label: '拡張機能ZIP出力', icon: Download },
    { id: 'mobile', label: 'スマホ対応ガイド', icon: Smartphone },
    { id: 'stats', label: '効果＆統計', icon: BarChart3 },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* ロゴ */}
        <div 
          onClick={() => onSelectTab('simulator')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-base select-none">🧘</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                <span>ZenBlock</span>
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  MV3
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              SNS中毒予防＆ドメイン遮断 拡張機能
            </p>
          </div>
        </div>

        {/* ナビゲーションタブ（デスクトップ） */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* クイックZIPダウンロード */}
        <div className="flex items-center gap-2">
          <button
            onClick={onQuickDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-transform hover:scale-105 active:scale-95"
            title="現在の設定で拡張機能ZIPをダウンロード"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZIPをダウンロード</span>
            <span className="sm:hidden">ZIP</span>
          </button>
        </div>
      </div>

      {/* モバイル用下部タブスクロール */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-950 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
