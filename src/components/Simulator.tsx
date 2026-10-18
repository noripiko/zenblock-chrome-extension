import React, { useState } from 'react';
import { 
  Laptop, 
  Smartphone, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Plus, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { ExtensionConfig, BlockedDomain, FocusStats } from '../types/extension';
import { InterventionScreen } from './InterventionScreen';

interface SimulatorProps {
  config: ExtensionConfig;
  stats: FocusStats;
  onRecordAction: (domain: string, action: 'resisted' | 'bypassed') => void;
  onAddDomain: (domain: string) => void;
}

export const Simulator: React.FC<SimulatorProps> = ({
  config,
  stats,
  onRecordAction,
  onAddDomain,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [inputUrl, setInputUrl] = useState('x.com');
  const [currentUrl, setCurrentUrl] = useState('x.com');
  const [temporaryPasses, setTemporaryPasses] = useState<Record<string, number>>({});
  const [warningBannerDismissed, setWarningBannerDismissed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 一致するブロックルールを検索
  const findRule = (urlStr: string): BlockedDomain | undefined => {
    let clean = urlStr.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return config.domains.find(
      (d) => d.enabled && (clean === d.domain.toLowerCase() || clean.endsWith('.' + d.domain.toLowerCase()))
    );
  };

  const matchedRule = findRule(currentUrl);

  // 一時解除パスが有効か確認
  const isPassActive = matchedRule ? (temporaryPasses[matchedRule.domain] || 0) > Date.now() : false;

  const handleNavigate = (target: string) => {
    let clean = target.trim();
    if (!clean) return;
    setInputUrl(clean);
    setCurrentUrl(clean);
    setWarningBannerDismissed(false);
    setElapsedSeconds(0);
  };

  const handleTempPass = (domain: string, minutes: number) => {
    const expiry = Date.now() + minutes * 60 * 1000;
    setTemporaryPasses((prev) => ({ ...prev, [domain]: expiry }));
    onRecordAction(domain, 'bypassed');
  };

  const handleResist = () => {
    if (matchedRule) {
      onRecordAction(matchedRule.domain, 'resisted');
    }
    // ホームまたは白紙へ戻る
    handleNavigate('google.com');
  };

  // タイマー更新（警告バー表示時）
  React.useEffect(() => {
    if (matchedRule?.blockMode === 'warning_bar' || isPassActive) {
      const interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchedRule, isPassActive]);

  const quickSites = [
    { label: 'X (Twitter)', url: 'x.com', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    { label: 'Instagram', url: 'instagram.com', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    { label: 'YouTube', url: 'youtube.com', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { label: 'TikTok', url: 'tiktok.com', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { label: 'Yahoo! ニュース', url: 'news.yahoo.co.jp', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { label: 'Wikipedia (通常)', url: 'wikipedia.org', color: 'bg-slate-700/30 text-slate-300 border-slate-700' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 上部コントロールバー */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">動作プレビュー・シミュレーター</h3>
            <p className="text-xs text-slate-400">
              実際の拡張機能が動いた時のブロック画面や警告バーを、PC・スマホ両方の画面でリアルタイムに体験できます
            </p>
          </div>
        </div>

        {/* PC / スマホ切り替え */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              device === 'desktop'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>PC画面</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              device === 'mobile'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>スマホ画面</span>
          </button>
        </div>
      </div>

      {/* クイック試行バッジ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 whitespace-nowrap font-medium flex items-center gap-1">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          ワンクリックで試す:
        </span>
        {quickSites.map((site) => (
          <button
            key={site.url}
            onClick={() => handleNavigate(site.url)}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-transform hover:scale-105 font-medium ${site.color}`}
          >
            {site.label}
          </button>
        ))}
      </div>

      {/* ブラウザフレーム外枠 */}
      <div
        className={`mx-auto transition-all duration-300 w-full ${
          device === 'desktop' ? 'max-w-4xl' : 'max-w-sm'
        }`}
      >
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* ブラウザ上部UI */}
          <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
            {/* ウィンドウボタン（Mac風） */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* ナビゲーション矢印 */}
            <div className="hidden sm:flex items-center gap-1 text-slate-500">
              <button 
                onClick={() => handleNavigate('google.com')}
                className="p-1 hover:text-slate-300 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-slate-300 rounded opacity-40">
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNavigate(currentUrl)}
                className="p-1 hover:text-slate-300 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* アドレスバー */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(inputUrl);
              }}
              className="flex-1 flex items-center bg-slate-900 border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
            >
              <span className="text-slate-500 mr-2">🔒</span>
              <span className="text-slate-500 select-none">https://</span>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="ドメインを入力 (例: x.com, instagram.com)"
                className="flex-1 bg-transparent border-none outline-none text-white font-medium"
              />
              <button
                type="submit"
                className="ml-2 px-2.5 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold"
              >
                移動
              </button>
            </form>

            {/* 拡張機能アイコン（ZenBlockバッジ） */}
            <div className="relative group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-md">
                🧘
              </div>
              <div className="absolute right-0 top-9 hidden group-hover:block w-48 bg-slate-800 border border-slate-700 text-white text-[11px] p-2.5 rounded-xl shadow-xl z-50">
                <div className="font-bold text-cyan-300 mb-1">ZenBlock 稼働中</div>
                <div>本日のセーブ: {stats.blocksToday}回 ({stats.minutesSaved}分節約)</div>
              </div>
            </div>
          </div>

          {/* ブラウザビューポート（表示領域） */}
          <div className="relative bg-slate-950 min-h-[540px] flex flex-col">
            {/* 警告バーモード（または一時解除パス有効時）の上部バナー */}
            {matchedRule && (matchedRule.blockMode === 'warning_bar' || isPassActive) && !warningBannerDismissed && (
              <div className="w-full bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/40 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg z-30">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {isPassActive ? '一時解除中 (残り約5分)' : '🧘 ZenBlock 警告'}
                  </span>
                  <span className="text-slate-200">
                    <strong>{matchedRule.name}</strong> を閲覧中。ダラダラ見に注意！目的が済んだら閉じましょう。
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 font-mono bg-black/40 px-2 py-0.5 rounded text-amber-400 font-bold">
                    <Clock className="w-3 h-3" />
                    <span>
                      {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                      {String(elapsedSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={handleResist}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-colors"
                  >
                    タブを閉じる
                  </button>
                  <button
                    onClick={() => setWarningBannerDismissed(true)}
                    className="text-slate-400 hover:text-white px-1 text-sm"
                    title="バーを最小化"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* メインコンテンツ表示 */}
            {matchedRule && !isPassActive && matchedRule.blockMode !== 'warning_bar' ? (
              /* ブロック・マインドフル待機画面 */
              <InterventionScreen
                domain={matchedRule.domain}
                domainName={matchedRule.name}
                blockMode={matchedRule.blockMode}
                delaySeconds={config.delaySeconds || 15}
                pledgeText={config.customPledgeText}
                quote={config.customMotivationalQuote}
                onCloseTab={handleResist}
                onTempPass={handleTempPass}
              />
            ) : (
              /* 通常ページ（許可されたページ、または一時解除中のページ） */
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  {matchedRule && isPassActive ? (
                    <div>
                      <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        {matchedRule.name} は一時許可されています
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        5分間のタイマーが切れると、再び遮断ガードが有効化されます。目的の作業が終わったらすぐにタブを閉じましょう。
                      </p>
                      <button
                        onClick={handleResist}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
                      >
                        閲覧を終了して保護に戻る
                      </button>
                    </div>
                  ) : matchedRule && matchedRule.blockMode === 'warning_bar' ? (
                    <div>
                      <div className="text-3xl mb-2">📺</div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        {matchedRule.name} ({currentUrl})
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        警告バーモードが有効です。ページ上部に閲覧時間タイマーが表示されています。
                      </p>
                      <div className="p-3 bg-slate-950/80 rounded-lg text-xs text-amber-300 border border-amber-500/20 mb-4">
                        ⚠ 時間を決めて閲覧しましょう。無限スクロールは思考力を奪います。
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-3">🌐</div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        {currentUrl}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        このドメインは現在ブロック対象に含まれていません。通常のWebブラウジングが可能です。
                      </p>
                      <button
                        onClick={() => {
                          onAddDomain(currentUrl);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>「{currentUrl}」をブロック対象に追加する</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* シミュレーター解説フッター */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 block mb-0.5">Manifest V3 規格準拠</strong>
            Google Chromeの最新拡張機能基準に対応。バッテリー負荷ゼロで瞬時にURLを判定します。
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 block mb-0.5">スマホブラウザ完全対応</strong>
            Android（Kiwi Browser）やiOS（Orion）の拡張機能エンジンでそのまま稼働します。
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 block mb-0.5">脳科学に基づくアプローチ</strong>
            30秒の呼吸や計算クイズでドーパミン中毒の衝動をリセットし、自発的にタブを閉じさせます。
          </div>
        </div>
      </div>
    </div>
  );
};
