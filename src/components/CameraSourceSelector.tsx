import React from 'react';
import { Camera, Radio } from 'lucide-react';
import { CameraSourceType } from '../types';

interface Props {
  activeSource: CameraSourceType;
  onChangeSource: (source: CameraSourceType) => void;
}

export const CameraSourceSelector: React.FC<Props> = ({ activeSource, onChangeSource }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <span>Camera Source</span>
        <span className="text-[10px] text-purple-400 lowercase font-mono">
          {activeSource === 'physical' ? 'Hardware CameraX' : 'Virtual RTMP Pipeline'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-1 bg-white/5 border border-white/5 rounded-2xl">
        <button
          type="button"
          onClick={() => onChangeSource('physical')}
          className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm tracking-wide transition-all ${
            activeSource === 'physical'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.01]'
              : 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>📷 REAL CAMERA</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSource('rtmp')}
          className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm tracking-wide transition-all ${
            activeSource === 'rtmp'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.01]'
              : 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-4 h-4 shrink-0" />
          <span>📡 RTMP STREAM</span>
        </button>
      </div>
    </div>
  );
};
