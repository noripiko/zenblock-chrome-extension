import React, { useState } from 'react';
import { 
  Smartphone, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Flame,
  Globe,
  Settings,
  Lock
} from 'lucide-react';

export const MobileGuide: React.FC = () => {
  const [selectedMobileOS, setSelectedMobileOS] = useState<'android' | 'ios'>('android');
  const [activeAccordion, setActiveAccordion] = useState<string>('browser-ext');

  return (
    <div className="flex flex-col gap-6">
      {/* イントロバナー */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              スマホでも使える！完全脱SNS環境構築ガイド
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              「スマホの標準Chromeは拡張機能が使えない？」いいえ、スマホでも拡張機能は動きます！<br className="hidden sm:inline" />
              さらにアプリ版SNSも徹底ガードする最強の組み合わせを伝授します。
            </p>
          </div>
        </div>

        {/* OS切り替えタブ */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setSelectedMobileOS('android')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedMobileOS === 'android'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🤖 Android の場合</span>
          </button>
          <button
            onClick={() => setSelectedMobileOS('ios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedMobileOS === 'ios'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🍎 iPhone (iOS) の場合</span>
          </button>
        </div>
      </div>

      {/* Android向け手順 */}
      {selectedMobileOS === 'android' && (
        <div className="flex flex-col gap-4">
          {/* 手法1: Kiwi Browser で拡張機能を直接動かす */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  おすすめ手法 1
                </span>
                <h4 className="font-bold text-white text-base">
                  Kiwi Browser に本拡張機能（ZIP）を導入する
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">Chrome拡張完全対応</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Google Playストアで無料提供されている「<strong>Kiwi Browser</strong>」や「<strong>Lemur Browser</strong>」は、Chromiumベースで作られており、<strong>PC用のChrome拡張機能がそのままスマホで動作</strong>します！
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Step 1</span>
                Playストアから「Kiwi Browser」をインストール。
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Step 2</span>
                本サイトの「拡張機能ZIP」をスマホにダウンロード。
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Step 3</span>
                Kiwi右上のメニュー &gt; [拡張機能] &gt; [Developer mode]をON。
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Step 4</span>
                [+(from .zip/.crx)] をタップしてZIPを選択すれば導入完了！
              </div>
            </div>
          </div>

          {/* 手法2: デジタルウェルビーイング */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                おすすめ手法 2
              </span>
              <h4 className="font-bold text-white text-base">
                Android標準「Digital Wellbeing & フォーカスモード」
              </h4>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              ブラウザだけでなく、XやInstagramの「アプリ版」そのものを封印したい場合の王道設定です。
            </p>
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>アプリタイマー設定</strong>: [設定] &gt; [Digital Wellbeingと保護者による使用制限] &gt; 対象アプリ（XやYouTubeなど）の一日利用上限を「15分」に設定。
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>フォーカスモードのスケジュール化</strong>: 仕事・勉強時間中はSNSアプリをグレーアウトして通知すら来ない状態にできます。
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS (iPhone) 向け手順 */}
      {selectedMobileOS === 'ios' && (
        <div className="flex flex-col gap-4">
          {/* 手法1: Orion Browser */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">
                  おすすめ手法 1
                </span>
                <h4 className="font-bold text-white text-base">
                  Orion Browser でChrome拡張機能を動かす
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">iOS対応Webブラウザ</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              iPhoneのSafariは自作拡張機能の読み込みにMacのXcodeが必要ですが、App Storeで無料の「<strong>Orion Browser by Kagi</strong>」を使えば、iPhone上でChrome拡張機能を直接有効化できます！
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">Step 1</span>
                App Storeから「Orion Browser」をダウンロード。
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">Step 2</span>
                Orion設定 &gt; 拡張機能 &gt; [拡張機能を追加] をタップ。
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">Step 3</span>
                ダウンロードしたZenBlockパッケージを指定して有効化！
              </div>
            </div>
          </div>

          {/* 手法2: スクリーンタイム鉄壁設定 */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                おすすめ手法 2
              </span>
              <h4 className="font-bold text-white text-base">
                iPhone「スクリーンタイム」鉄壁防衛術
              </h4>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              SNS中毒を本気でやめたい人に最も効果的な設定です。
            </p>
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>コンテンツ制限で成人向け・特定Webサイトを制限</strong>: [設定] &gt; [スクリーンタイム] &gt; [コンテンツとプライバシーの制限] &gt; [Webコンテンツ] で <code className="text-cyan-400">x.com</code> や <code className="text-cyan-400">instagram.com</code> を「常に許可しない」に登録。Safariでも完全遮断されます。
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>パスコードを他人に設定してもらう（最重要）</strong>: 自分でパスコードを知っていると無意識に解除してしまいます。信頼できる家族や友人にだけパスコードを入力してもらうと、絶対にやめられます。
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 手法3: 習慣置き換え（ゲートキーパー・ブックマーク） */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-3">
          <Flame className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-white text-base">
            習慣置き換え法：ホーム画面のSNSアイコンを「自省ゲート」にすり替える
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
          スマホ中毒の8割は「無意識に親指がSNSアプリアイコンをタップしていること」が原因です。<br />
          アプリ版SNS（TwitterやInstagramアプリ）をアンインストールし、ホーム画面のその位置に<strong>「このZenBlockシミュレーター」や「深呼吸ページ」のショートカットを配置</strong>してください。
        </p>
        <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/20 text-xs text-amber-200">
          💡 親指が勝手にアイコンを押した瞬間に「深呼吸して立ち止まる画面」が開くため、無意識のドーパミンループを強力に断ち切ることができます。
        </div>
      </div>
    </div>
  );
};
