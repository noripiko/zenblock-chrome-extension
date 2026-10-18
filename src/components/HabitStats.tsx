import React from 'react';
import { 
  Trophy, 
  Clock, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  History, 
  Sparkles, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { FocusStats } from '../types/extension';

interface HabitStatsProps {
  stats: FocusStats;
  onResetStats: () => void;
}

export const HabitStats: React.FC<HabitStatsProps> = ({ stats, onResetStats }) => {
  const hoursSaved = (stats.minutesSaved / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      {/* 統計カード一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 本日のブロック数 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">本日の誘惑回避</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {stats.blocksToday} <span className="text-sm font-normal text-slate-400">回</span>
          </div>
          <p className="text-[11px] text-cyan-400 mt-2 font-medium">
            SNSの衝動を踏みとどまりました
          </p>
        </div>

        {/* 節約できた時間 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">取り戻した時間</span>
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-400 font-mono">
            {stats.minutesSaved >= 60 ? hoursSaved : stats.minutesSaved}{' '}
            <span className="text-sm font-normal text-slate-400">
              {stats.minutesSaved >= 60 ? '時間' : '分'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            1回の回避で約15分のスクロールを予防
          </p>
        </div>

        {/* 継続日数 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">集中ストリーク</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {stats.streakDays} <span className="text-sm font-normal text-slate-400">日連続</span>
          </div>
          <p className="text-[11px] text-amber-300 mt-2 font-medium">
            意識的な時間管理が続いています！
          </p>
        </div>

        {/* 累計ブロック数 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">累計ブロック</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {stats.totalBlocks} <span className="text-sm font-normal text-slate-400">回</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            積み重ねた自己コントロールの証
          </p>
        </div>
      </div>

      {/* 取り戻した時間でできること */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>SNSをやめて取り戻した時間でできたこと</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <strong className="text-cyan-300 block mb-1">📖 読書・勉強</strong>
            30分あれば本を1〜2章じっくり読み進め、長期記憶として定着させられます。
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <strong className="text-emerald-300 block mb-1">🏃 散歩・適度な運動</strong>
            外の空気を吸って歩くことで、ドーパミン神経が自然にリセットされ睡眠が深くなります。
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">☕ マインドの余白</strong>
            退屈に耐える時間こそ、新しいアイデアや自分だけの深い思考が生まれる時間です。
          </div>
        </div>
      </div>

      {/* 履歴リスト */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <span>直近のブロック・シミュレーション履歴</span>
          </h4>
          <button
            onClick={onResetStats}
            className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>統計をリセット</span>
          </button>
        </div>

        {stats.history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            まだ履歴がありません。「シミュレーター」でSNSへのアクセスを試してみましょう！
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {stats.history.slice(0, 10).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.action === 'resisted' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-mono text-slate-200">{item.domain}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.action === 'resisted'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {item.action === 'resisted' ? '誘惑を回避（タブ閉）' : '5分一時解除'}
                  </span>
                  <span className="text-slate-500 text-[11px]">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
