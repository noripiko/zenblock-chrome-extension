import React, { useState, useEffect } from 'react';
import { ShieldAlert, Wind, CheckCircle2, XCircle, Brain, Lock, ExternalLink, Volume2, VolumeX, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BlockMode, BlockedDomain } from '../types/extension';
import { MATH_CHALLENGES, MOTIVATIONAL_QUOTES } from '../data/presetDomains';

interface InterventionScreenProps {
  domain: string;
  domainName: string;
  blockMode: BlockMode;
  delaySeconds?: number;
  pledgeText?: string;
  quote?: string;
  onCloseTab: () => void;
  onTempPass: (domain: string, minutes: number) => void;
}

export const InterventionScreen: React.FC<InterventionScreenProps> = ({
  domain,
  domainName,
  blockMode,
  delaySeconds = 15, // デモ用に15秒（本番は30秒設定可）
  pledgeText = '私の時間は有限です。無目的な閲覧をやめて本来の目標に集中します。',
  quote,
  onCloseTab,
  onTempPass,
}) => {
  // 呼吸タイマー状態
  const [timeLeft, setTimeLeft] = useState(delaySeconds);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // タイピング宣誓状態
  const [typedText, setTypedText] = useState('');

  // 計算チャレンジ状態
  const [mathIndex, setMathIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathSolved, setMathSolved] = useState(false);

  // ランダム名言
  const displayQuote = quote || MOTIVATIONAL_QUOTES[0];

  // Web Audio API による穏やかな呼吸音
  const playZenBell = (frequency = 440) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {
      // AudioContext unavailable
    }
  };

  // 呼吸カウントダウン
  useEffect(() => {
    if (blockMode !== 'breath') return;
    setTimeLeft(delaySeconds);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playZenBell(528); // 愛・修復のソルフェジオ周波数風トーン
          return 0;
        }
        // 4秒ごとに吸う・吐く切り替え
        const remaining = prev - 1;
        const phase = (remaining % 8 >= 4) ? 'inhale' : 'exhale';
        setBreathPhase(phase);
        return remaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [blockMode, delaySeconds]);

  // 誘惑に打ち勝った時（タブを閉じる）の祝福
  const handleResist = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
    });
    onCloseTab();
  };

  // 一時解除
  const handlePass = () => {
    onTempPass(domain, 5);
  };

  // 計算回答チェック
  const currentMath = MATH_CHALLENGES[mathIndex % MATH_CHALLENGES.length];
  const handleMathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMathAnswer(val);
    if (parseInt(val.trim(), 10) === currentMath.answer) {
      setMathSolved(true);
      playZenBell(660);
    } else {
      setMathSolved(false);
    }
  };

  const isPledgeValid = typedText.trim() === pledgeText.trim();
  const isBreathReady = timeLeft === 0;

  return (
    <div className="relative min-h-[520px] w-full flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-950 text-slate-100 rounded-2xl overflow-hidden select-none border border-slate-800 shadow-2xl">
      {/* 背景オーラ */}
      <div className="absolute w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[380px] h-[380px] rounded-full bg-gradient-to-bl from-cyan-600/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none -bottom-20 -right-20 animate-pulse" />

      {/* サウンドトグル */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 border border-slate-700/60"
        title="瞑想チャイム音のON/OFF"
      >
        {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span>{soundEnabled ? '音: ON' : '音: OFF'}</span>
      </button>

      {/* メインカード */}
      <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center">
        {/* バッジ */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>ZenBlock セーフガード発動中</span>
        </div>

        {/* 見出し */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          ちょっと立ち止まりましょう
        </h2>

        {/* 対象ドメイン */}
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          <span className="font-bold text-cyan-400 underline decoration-cyan-500/40 underline-offset-4">
            {domainName} ({domain})
          </span>{' '}
          を開こうとしています。<br className="hidden sm:inline" />
          それは本当にいま、見る必要がありますか？
        </p>

        {/* モード別コンテンツ */}
        <div className="w-full mb-6">
          {/* 1. 深呼吸モード */}
          {blockMode === 'breath' && (
            <div className="flex flex-col items-center py-2">
              <div
                className={`relative flex items-center justify-center rounded-full border-4 transition-all duration-1000 ${
                  breathPhase === 'inhale'
                    ? 'w-40 h-40 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.4)] scale-110'
                    : 'w-36 h-36 border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-95'
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <Wind className={`w-5 h-5 mb-1 ${breathPhase === 'inhale' ? 'text-cyan-300 animate-bounce' : 'text-indigo-300'}`} />
                  <span className="text-xs font-semibold text-slate-300">
                    {timeLeft === 0 ? '準備完了' : breathPhase === 'inhale' ? '息を吸って...' : 'ゆっくり吐いて...'}
                  </span>
                  <span className="text-3xl font-black font-mono text-white mt-0.5">
                    {timeLeft}s
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 max-w-xs">
                ドーパミンの衝動は<strong className="text-slate-200">最初の30秒</strong>で落ち着きます。焦らず深呼吸してください。
              </p>
            </div>
          )}

          {/* 2. タイピング宣誓モード */}
          {blockMode === 'pledge' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>宣誓文を入力してください（タイピング認証）</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg text-sm text-slate-200 font-medium border border-slate-800/80 mb-3 border-l-4 border-l-indigo-500">
                {pledgeText}
              </div>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="上記の文章を正確に入力..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-between text-xs mt-2 text-slate-400">
                <span>一致判定:</span>
                <span className={isPledgeValid ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {isPledgeValid ? '✓ 宣誓が確認されました' : '未入力 / 不一致'}
                </span>
              </div>
            </div>
          )}

          {/* 3. 計算チャレンジモード */}
          {blockMode === 'math' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-cyan-300 mb-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>前頭葉を覚醒させる計算クイズ</span>
              </div>
              <div className="text-2xl font-black text-cyan-400 my-2 tracking-wide font-mono">
                {currentMath.question}
              </div>
              <div className="max-w-xs mx-auto flex gap-2">
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={handleMathChange}
                  placeholder="答えを入力..."
                  className="w-full text-center py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => {
                    setMathIndex((prev) => prev + 1);
                    setMathAnswer('');
                    setMathSolved(false);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-300 transition-colors"
                >
                  別問題
                </button>
              </div>
              <div className="text-xs mt-2 font-medium">
                {mathSolved ? (
                  <span className="text-emerald-400">✓ 正解！前頭葉が活性化しました</span>
                ) : (
                  <span className="text-slate-500">計算を解いて衝動をリセットしましょう</span>
                )}
              </div>
            </div>
          )}

          {/* 4. 厳格モード */}
          {blockMode === 'strict' && (
            <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-4 text-center">
              <div className="inline-flex p-2.5 rounded-full bg-rose-500/10 text-rose-400 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-rose-300 mb-1">
                ⛔ 厳格遮断中（アクセス不可）
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                このサイトは設定により閲覧が禁止されています。解除ボタンはありません。今日やるべき本来の仕事や勉強に戻りましょう。
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="w-full flex flex-col gap-2.5">
          {/* 誘惑に打ち勝つボタン */}
          <button
            onClick={handleResist}
            className="w-full py-3 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm transition-all duration-200 border border-slate-700/80 flex items-center justify-center gap-2 hover:border-slate-600 shadow-md group"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>誘惑に打ち勝ち、タブを閉じる（推奨）</span>
          </button>

          {/* 一時解除ボタン（厳格モード以外） */}
          {blockMode !== 'strict' && (
            <button
              onClick={handlePass}
              disabled={
                (blockMode === 'breath' && !isBreathReady) ||
                (blockMode === 'pledge' && !isPledgeValid) ||
                (blockMode === 'math' && !mathSolved)
              }
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                (blockMode === 'breath' && isBreathReady) ||
                (blockMode === 'pledge' && isPledgeValid) ||
                (blockMode === 'math' && mathSolved)
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg cursor-pointer'
                  : 'bg-slate-900 text-slate-500 border border-slate-800/80 cursor-not-allowed opacity-50'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {blockMode === 'breath' && !isBreathReady && `深呼吸中（あと ${timeLeft}秒）`}
                {blockMode === 'breath' && isBreathReady && '冷静になりました：5分だけ閲覧する'}
                {blockMode === 'pledge' && !isPledgeValid && '宣誓文を入力すると解除できます'}
                {blockMode === 'pledge' && isPledgeValid && '宣誓完了：5分だけ閲覧する'}
                {blockMode === 'math' && !mathSolved && '計算に正解すると解除できます'}
                {blockMode === 'math' && mathSolved && '正解！：5分だけ閲覧する'}
              </span>
            </button>
          )}
        </div>

        {/* 名言エリア */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs italic text-slate-400 max-w-sm">
          「{displayQuote}」
        </div>
      </div>
    </div>
  );
};
