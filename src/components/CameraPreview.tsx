import React from 'react';
import { RefreshCw, RotateCcw, Maximize2, Minimize2, Radio, Smartphone, Monitor } from 'lucide-react';
import { CameraSourceType, ConnectionState, ScalingMode, StreamInfo } from '../types';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeSourceType: CameraSourceType;
  connectionState: ConnectionState;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  streamInfo: StreamInfo | null;
  scalingMode: ScalingMode;
  isRecording: boolean;
  recordingSeconds: number;
  isPhotoFlashing: boolean;
  onSwitchLens: () => void;
  onToggleOrientation: () => void;
  onCancelReconnect: () => void;
}

export const CameraPreview: React.FC<Props> = ({
  canvasRef,
  activeSourceType,
  connectionState,
  reconnectAttempt,
  maxReconnectAttempts,
  streamInfo,
  scalingMode,
  isRecording,
  recordingSeconds,
  isPhotoFlashing,
  onSwitchLens,
  onToggleOrientation,
  onCancelReconnect
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Format recording timer: mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Determine scaling class
  const getScalingClass = () => {
    switch (scalingMode) {
      case 'crop':
        return 'w-full h-full object-cover';
      case 'original':
        return 'max-w-none object-none';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 select-none ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'aspect-video md:aspect-[16/10] max-h-[58vh]'
      }`}
    >
      {/* Target Rendering Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`transition-all duration-200 ${getScalingClass()}`}
      />

      {/* Snapshot Shutter Flash Effect */}
      {isPhotoFlashing && (
        <div className="absolute inset-0 bg-white pointer-events-none z-40 animate-out fade-out duration-300" />
      )}

      {/* Idle / Disconnected Placeholder */}
      {connectionState === 'disconnected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d0e12]/90 backdrop-blur-xs text-neutral-400">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-3 shadow-xl">
            {activeSourceType === 'physical' ? (
              <RefreshCw className="w-7 h-7 stroke-1" />
            ) : (
              <Radio className="w-7 h-7 stroke-1" />
            )}
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            {activeSourceType === 'physical'
              ? 'Physical Camera Ready'
              : 'RTMP Stream Source Standby'}
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm">
            {activeSourceType === 'physical'
              ? 'Press "CONNECT & LIVE" to initialize hardware camera capture.'
              : 'Enter an RTMP endpoint and click "CONNECT & LIVE" to decode video.'}
          </p>
        </div>
      )}

      {/* Connecting Indicator */}
      {connectionState === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-xs text-amber-300">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-amber-400" />
          <p className="text-sm font-bold tracking-wide">Connecting to RTMP Stream...</p>
          <p className="text-xs text-neutral-400 mt-1">Establishing TCP socket on port 1935</p>
        </div>
      )}

      {/* Reconnecting Overlay (Section 13 Auto Reconnect) */}
      {connectionState === 'reconnecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/85 backdrop-blur-xs text-amber-300 z-30">
          <RefreshCw className="w-9 h-9 animate-spin mb-3 text-amber-400" />
          <h4 className="text-base font-bold text-white">Connection Lost</h4>
          <p className="text-sm text-amber-300 font-semibold mt-1">
            Reconnecting... {reconnectAttempt}/{maxReconnectAttempts}
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            Automatic backoff in progress. You can stop or edit the stream URL anytime.
          </p>
          <button
            onClick={onCancelReconnect}
            className="mt-4 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg transition-all"
          >
            STOP RECONNECTING
          </button>
        </div>
      )}

      {/* TOP HUD OVERLAY */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Status Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold flex items-center gap-2">
            {connectionState === 'streaming' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Streaming</span>
              </>
            )}
            {connectionState === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300">Connected</span>
              </>
            )}
            {connectionState === 'connecting' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300">Connecting...</span>
              </>
            )}
            {connectionState === 'reconnecting' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300">Reconnecting... {reconnectAttempt}/5</span>
              </>
            )}
            {connectionState === 'disconnected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span className="text-neutral-400">Disconnected</span>
              </>
            )}
            {(connectionState === 'error' || connectionState === 'connection_lost') && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-400">Connection Error</span>
              </>
            )}
          </div>

          {/* Active Source Tag */}
          <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-[10px] uppercase font-mono text-purple-200">
            {activeSourceType === 'physical' ? 'Physical Camera' : 'RTMP Virtual'}
          </span>
        </div>

        {/* Right side HUD: Recording Indicator & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Live Recording Badge */}
          {isRecording && (
            <div className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>REC {formatTimer(recordingSeconds)}</span>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* BOTTOM HUD OVERLAY: Resolution, FPS & Camera Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Stream Metrics HUD */}
        <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-neutral-300 flex items-center gap-2 pointer-events-auto">
          <span className="text-purple-300 font-bold">
            {streamInfo ? `${streamInfo.width}x${streamInfo.height}` : '0x0'}
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">
            {streamInfo ? `${streamInfo.fps} FPS` : '0 FPS'}
          </span>
          {streamInfo && (
            <>
              <span>•</span>
              <span className="text-neutral-400 text-[10px] hidden sm:inline">
                {streamInfo.aspectRatioLabel}
              </span>
            </>
          )}
        </div>

        {/* Action icons: Flip lens / Toggle orientation */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {activeSourceType === 'physical' && (
            <button
              onClick={onSwitchLens}
              className="p-2 rounded-xl bg-black/70 hover:bg-purple-600 backdrop-blur-md border border-white/10 text-white transition-all shadow-md active:scale-95"
              title="Switch Front/Back Camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {activeSourceType === 'rtmp' && (
            <button
              onClick={onToggleOrientation}
              className="px-2.5 py-1.5 rounded-xl bg-black/70 hover:bg-purple-600 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Toggle Portrait / Landscape Stream"
            >
              {streamInfo?.isPortrait ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-purple-300" />
                  <span>9:16 Portrait</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5 text-purple-300" />
                  <span>16:9 Landscape</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
