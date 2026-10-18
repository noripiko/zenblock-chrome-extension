import React, { useState } from 'react';
import { 
  Download, 
  FileCode, 
  Copy, 
  Check, 
  FolderArchive, 
  ExternalLink, 
  Terminal, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ExtensionConfig } from '../types/extension';
import { generateExtensionFiles, downloadExtensionZip, GeneratedFile } from '../utils/extensionGenerator';

interface ExtensionDownloaderProps {
  config: ExtensionConfig;
}

export const ExtensionDownloader: React.FC<ExtensionDownloaderProps> = ({ config }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('manifest.json');
  const [copied, setCopied] = useState(false);

  const files = generateExtensionFiles(config);
  const selectedFile = files.find((f) => f.name === selectedFileName) || files[0];

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadExtensionZip(config);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (e) {
      console.error('Download failed', e);
      alert('ZIPの生成に失敗しました。');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ダウンロードCTAバナー */}
      <div className="relative bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Manifest V3 対応パッケージ</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
              今すぐ使える拡張機能パッケージをダウンロード
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              現在の設定（遮断ドメイン{config.domains.filter((d) => d.enabled).length}件、スケジュール、マインドフル待機）が組み込まれた完全なChrome拡張機能ZIPを一発出力します。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ZIP生成中...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>ダウンロード完了！</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>拡張機能ZIPをダウンロード</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* インストール手順ガイド（PC） */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>パソコン（Chrome / Edge / Brave）への4ステップ導入手順</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs mb-2">
                1
              </span>
              <strong className="text-white block mb-1">ZIPを解凍する</strong>
              <p className="text-slate-400">
                ダウンロードした <code className="text-cyan-400">zenblock-chrome-extension.zip</code> をお好きなフォルダに解凍します。
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs mb-2">
                2
              </span>
              <strong className="text-white block mb-1">拡張機能画面を開く</strong>
              <p className="text-slate-400 mb-2">
                ブラウザのアドレスバーに以下を入力してEnterを押します：
              </p>
              <div className="bg-slate-900 p-1.5 rounded font-mono text-[10px] text-cyan-300 break-all select-all border border-slate-800">
                chrome://extensions
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs mb-2">
                3
              </span>
              <strong className="text-white block mb-1">デベロッパーモードをON</strong>
              <p className="text-slate-400">
                画面右上のトグルスイッチ「デベロッパー モード」をクリックしてONにします。
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs mb-2">
                4
              </span>
              <strong className="text-white block mb-1">フォルダを読み込む</strong>
              <p className="text-slate-400">
                左上「パッケージ化されていない拡張機能を読み込む」から、解凍したフォルダを選べば即座に稼働開始！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ソースコードインスペクター */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">
              生成ファイル・ソースコードプレビュー
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了' : 'コードをコピー'}</span>
            </button>
          </div>
        </div>

        {/* ファイルリストタブ */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFileName(file.name)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] transition-all ${
                selectedFileName === file.name
                  ? 'bg-indigo-600/30 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* コードビューア */}
        <div className="relative bg-slate-950 p-4 max-h-[460px] overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto">
            {selectedFile?.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
