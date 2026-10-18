export type BlockMode = 
  | 'strict'      // 完全にアクセス不可（戻るボタンのみ）
  | 'breath'      // 30秒の深呼吸・マインドフル待機後に解除可
  | 'math'        // 3問の計算問題を解いたら5分間だけ一時許可
  | 'pledge'      // 戒めの言葉をタイピングしたら5分間だけ一時許可
  | 'warning_bar'; // ページ上部に常時カウントダウン警告バーを表示

export interface BlockedDomain {
  id: string;
  domain: string;
  name: string;
  category: 'social' | 'video' | 'news' | 'entertainment' | 'custom';
  enabled: boolean;
  blockMode: BlockMode;
  iconName: string;
  notes?: string;
}

export interface ExtensionConfig {
  version: string;
  extensionName: string;
  description: string;
  defaultBlockMode: BlockMode;
  domains: BlockedDomain[];
  delaySeconds: number; // 呼吸待機秒数（デフォルト30秒）
  tempPassMinutes: number; // 一時解除の有効分数（デフォルト5分）
  scheduleEnabled: boolean;
  scheduleStart: string; // "09:00"
  scheduleEnd: string;   // "18:00"
  scheduleDays: number[]; // [1, 2, 3, 4, 5] (月〜金)
  customPledgeText: string;
  customMotivationalQuote: string;
  allowEmergencyBypass: boolean;
}

export interface FocusStats {
  blocksToday: number;
  totalBlocks: number;
  minutesSaved: number;
  streakDays: number;
  lastBlockedDomain?: string;
  lastBlockedTime?: string;
  history: Array<{
    id: string;
    domain: string;
    timestamp: string;
    action: 'resisted' | 'bypassed';
  }>;
}
