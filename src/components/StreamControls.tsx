import React from 'react';
import { Play, Square, Camera, Video, Clipboard, QrCode } from 'lucide-react';
import { CameraSourceType } from '../types';

interface Props {
  activeSourceType: CameraSourceType;
  rtmpUrl: string;
  onChangeRtmpUrl: (url: string) => void;
  isStreaming: boolean;
  isRecording: boolean;
  onToggleStream: () => void;
  onCapturePhoto: () => void;
  onToggleRecord: () => void;
  onOpenQrScanner: () => void;
}

const PRESET_URLS = [
  { label: 'Local LAN', url: 'rtmp://192.168.1.100/live/test' },
  { label: 'Studio HD', url: 'rtmp://studio.broadcast.internal:1935/live/stream1080p' },
  { label: 'Vertical Reel', url: 'rtmp://mobile.livestream.net/feed/vertical916' }
];

export const StreamControls: React.FC<Props> = ({
  activeSourceType,
  rtmpUrl,
  onChangeRtmpUrl,
  isStreaming,
  isRecording,
  onToggleStream,
  onCapturePhoto,
  onToggleRecord,
  onOpenQrScanner
}) => {
  const [pasteNotice, setPasteNotice] = React.useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeRtmpUrl(text.trim());
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 2000);
      }
    } catch {
      // If clipboard permission is denied or unsupported, fallback
      const manual = prompt('Paste RTMP URL:');
      if (manual) onChangeRtmpUrl(manual.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* RTMP URL Input (shown when RTMP Stream is selected) */}
      {activeSourceType === 'rtmp' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              RTMP Stream URL
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-400">Presets:</span>
              {PRESET_URLS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChangeRtmpUrl(preset.url)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-white/5 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={rtmpUrl}
                onChange={(e) => onChangeRtmpUrl(e.target.value)}
                placeholder="rtmp://example.com/live/stream"
                className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs md:text-sm placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handlePaste}
              className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">{pasteNotice ? 'PASTED' : 'PASTE'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenQrScanner}
              className="px-3 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              title="Scan RTMP QR code from monitor or mobile screen"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>SCAN QR</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Connect & Live / Stop Button */}
      <button
        type="button"
        onClick={onToggleStream}
        className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm md:text-base tracking-wide transition-all shadow-xl ${
          isStreaming
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
        }`}
      >
        {isStreaming ? (
          <>
            <Square className="w-5 h-5 fill-current" />
            <span>STOP STREAM</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current" />
            <span>CONNECT &amp; LIVE</span>
          </>
        )}
      </button>

      {/* Secondary Actions: CAPTURE PHOTO & RECORD */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCapturePhoto}
          disabled={!isStreaming}
          className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 border border-white/10 text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>CAPTURE PHOTO</span>
        </button>

        <button
          type="button"
          onClick={onToggleRecord}
          disabled={!isStreaming}
          className={`py-3 px-4 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 ${
            isRecording
              ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 border-white/10 text-white'
          }`}
        >
          <Video className={`w-4 h-4 ${isRecording ? 'text-rose-400 fill-current' : 'text-purple-400'}`} />
          <span>{isRecording ? 'STOP RECORDING' : 'RECORD'}</span>
        </button>
      </div>
    </div>
  );
};
