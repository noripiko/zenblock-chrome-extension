import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Shield, 
  Check, 
  Sliders, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { ExtensionConfig, BlockedDomain, BlockMode } from '../types/extension';

interface DomainSettingsProps {
  config: ExtensionConfig;
  onUpdateConfig: (newConfig: ExtensionConfig) => void;
}

export const DomainSettings: React.FC<DomainSettingsProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'domains' | 'schedule' | 'mindful'>('domains');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // 新規ドメイン追加フォーム
  const [newDomain, setNewDomain] = useState('');
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<BlockMode>('breath');

  // カテゴリ別フィルタ
  const filteredDomains = config.domains.filter((d) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'social') return d.category === 'social';
    if (filterCategory === 'video') return d.category === 'video';
    if (filterCategory === 'custom') return d.category === 'custom';
    return d.category !== 'social' && d.category !== 'video' && d.category !== 'custom';
  });

  // ドメインの有効/無効切替
  const toggleDomain = (id: string) => {
    const updated = config.domains.map((d) =>
      d.id === id ? { ...d, enabled: !d.enabled } : d
    );
    onUpdateConfig({ ...config, domains: updated });
  };

  // ドメインの遮断モード変更
  const updateDomainMode = (id: string, mode: BlockMode) => {
    const updated = config.domains.map((d) =>
      d.id === id ? { ...d, blockMode: mode } : d
    );
    onUpdateConfig({ ...config, domains: updated });
  };

  // ドメイン削除
  const deleteDomain = (id: string) => {
    const updated = config.domains.filter((d) => d.id !== id);
    onUpdateConfig({ ...config, domains: updated });
  };

  // 新規追加
  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = newDomain.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) return;

    if (config.domains.some((d) => d.domain.toLowerCase() === clean)) {
      alert('このドメインは既に登録されています');
      return;
    }

    const newEntry: BlockedDomain = {
      id: 'custom-' + Date.now(),
      domain: clean,
      name: newName.trim() || clean,
      category: 'custom',
      enabled: true,
      blockMode: newMode,
      iconName: 'globe',
      notes: 'ユーザー指定カスタム遮断ドメイン',
    };

    onUpdateConfig({
      ...config,
      domains: [newEntry, ...config.domains],
    });

    setNewDomain('');
    setNewName('');
  };

  // 曜日切替
  const toggleDay = (dayIndex: number) => {
    const current = config.scheduleDays || [];
    const exists = current.includes(dayIndex);
    const updated = exists ? current.filter((d) => d !== dayIndex) : [...current, dayIndex];
    onUpdateConfig({ ...config, scheduleDays: updated.sort() });
  };

  const daysLabel = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="flex flex-col gap-6">
      {/* タブナビゲーション */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'domains'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>遮断ドメイン管理 ({config.domains.filter((d) => d.enabled).length}件有効)</span>
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>作動スケジュール & 集中時間</span>
        </button>
        <button
          onClick={() => setActiveTab('mindful')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'mindful'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>マインドフル設定 & 誓いの言葉</span>
        </button>
      </div>

      {/* 1. ドメイン設定タブ */}
      {activeTab === 'domains' && (
        <div className="flex flex-col gap-5">
          {/* 新規ドメイン追加カード */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>新しいブロック対象サイトを追加</span>
            </h4>
            <form onSubmit={handleAddDomain} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  ドメイン (URL) *
                </label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="例: line.me, twitch.tv, yahoo.co.jp"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  サイト名 (表示名)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例: LINE WEB"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition-all h-[38px] flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>追加する</span>
                </button>
              </div>
            </form>
          </div>

          {/* カテゴリフィルタ */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-xs font-semibold">絞り込み:</span>
            {[
              { id: 'all', label: 'すべて' },
              { id: 'social', label: 'SNS (X/Instagram/Threads)' },
              { id: 'video', label: '動画 (YouTube/TikTok)' },
              { id: 'custom', label: 'カスタム登録' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ドメインリスト */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-lg">
            {filteredDomains.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  item.enabled ? 'bg-slate-900/40' : 'bg-slate-950/40 opacity-60'
                }`}
              >
                {/* サイト情報 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDomain(item.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      item.enabled
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    title={item.enabled ? '無効にする' : '有効にする'}
                  >
                    {item.enabled && <Check className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {item.domain}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                    )}
                  </div>
                </div>

                {/* モード選択＆削除ボタン */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={item.blockMode}
                    onChange={(e) => updateDomainMode(item.id, e.target.value as BlockMode)}
                    disabled={!item.enabled}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-40"
                  >
                    <option value="breath">🧘 30秒の深呼吸・マインドフル待機</option>
                    <option value="pledge">✍️ 戒めの言葉タイピング認証</option>
                    <option value="math">🧠 前頭葉覚醒・計算クイズ</option>
                    <option value="strict">⛔ 厳格遮断（解除不可）</option>
                    <option value="warning_bar">⚠ 上部警告バナー（経過タイマー）</option>
                  </select>

                  <button
                    onClick={() => deleteDomain(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. スケジュールタブ */}
      {activeTab === 'schedule' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>集中スケジュール連動</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                指定した時間帯・曜日のみブロックを作動させ、夜間や休日は自由にするなどの柔軟な運用が可能です
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.scheduleEnabled}
                onChange={(e) => onUpdateConfig({ ...config, scheduleEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${config.scheduleEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* 時間帯設定 */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>ブロック作動時間帯</span>
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-400 mb-1">開始時間</label>
                  <input
                    type="time"
                    value={config.scheduleStart}
                    onChange={(e) => onUpdateConfig({ ...config, scheduleStart: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm font-mono"
                  />
                </div>
                <span className="text-slate-500 pt-5">〜</span>
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-400 mb-1">終了時間</label>
                  <input
                    type="time"
                    value={config.scheduleEnd}
                    onChange={(e) => onUpdateConfig({ ...config, scheduleEnd: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                例: 09:00〜18:00（仕事や勉強のゴールデンタイムに集中ガード）
              </p>
            </div>

            {/* 曜日選択 */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>作動する曜日</span>
              </h4>
              <div className="flex items-center gap-1.5">
                {daysLabel.map((day, idx) => {
                  const isSelected = config.scheduleDays.includes(idx);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                <button
                  onClick={() => onUpdateConfig({ ...config, scheduleDays: [1, 2, 3, 4, 5] })}
                  className="hover:text-cyan-400 underline underline-offset-2"
                >
                  平日のみ (月〜金)
                </button>
                <button
                  onClick={() => onUpdateConfig({ ...config, scheduleDays: [0, 1, 2, 3, 4, 5, 6] })}
                  className="hover:text-cyan-400 underline underline-offset-2"
                >
                  毎日
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. マインドフル設定タブ */}
      {activeTab === 'mindful' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>マインドフルネス＆心理的ハードル設定</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              脳が衝動的にSNSを求めたときに、一拍置いて本来の目的を思い出させる文章や待機秒数を調整できます
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* 深呼吸タイマー秒数 */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">
                  深呼吸・待機秒数（デフォルト30秒）
                </label>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {config.delaySeconds}秒
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={config.delaySeconds}
                onChange={(e) => onUpdateConfig({ ...config, delaySeconds: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10秒（軽め）</span>
                <span>30秒（推奨・ドーパミン沈静）</span>
                <span>60秒（強力）</span>
              </div>
            </div>

            {/* タイピング宣誓文 */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                タイピング認証用の宣誓文
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                この文章を正確に入力しないと一時解除できなくなります。自分の目標や戒めの言葉を入れましょう。
              </p>
              <textarea
                rows={2}
                value={config.customPledgeText}
                onChange={(e) => onUpdateConfig({ ...config, customPledgeText: e.target.value })}
                className="w-full p-3 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 応援名言 */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                遮断画面に表示する名言・自分へのメッセージ
              </label>
              <input
                type="text"
                value={config.customMotivationalQuote}
                onChange={(e) => onUpdateConfig({ ...config, customMotivationalQuote: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
