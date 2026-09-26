import React from 'react';
import { Camera, Radio, X, Square } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
  isStreaming: boolean;
  onStopStreaming: () => void;
}

export const AndroidNotificationShade: React.FC<Props> = ({
  isOpen,
  onClose,
  streamUrl,
  isStreaming,
  onStopStreaming
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 bg-black/60 backdrop-blur-xs animate-in slide-in-from-top-6 duration-200">
      <div className="bg-[#24262f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Android Notification Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1d1f27] border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-400">Android System • Foreground Service</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Foreground Service Notification Card */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">RTMP Virtual Camera Active</h4>
                <span className="text-[10px] text-neutral-400">now</span>
              </div>
              <p className="text-xs text-neutral-300 truncate mt-0.5">
                Streaming from: <span className="font-mono text-purple-300">{streamUrl}</span>
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Background media decoding active with low-latency ExoPlayer buffer.
              </p>
            </div>
          </div>

          {/* Action buttons inside notification */}
          <div className="pt-2 border-t border-white/5 flex justify-end gap-2">
            <button
              onClick={() => {
                onStopStreaming();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-transparent text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop Streaming
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
