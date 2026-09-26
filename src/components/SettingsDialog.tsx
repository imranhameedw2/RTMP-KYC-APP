import React from 'react';
import { X, Settings, Wifi, Video, Camera, HardDrive, AlertTriangle } from 'lucide-react';
import { AppSettings, ScalingMode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsDialog: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [form, setForm] = React.useState<AppSettings>(settings);

  React.useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1e1f25] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#252730]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Stream &amp; Camera Settings</h2>
              <p className="text-xs text-neutral-400">ExoPlayer, RTMP Pipeline &amp; CameraX Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* RTMP Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <Wifi className="w-4 h-4" />
              <span>RTMP Configuration</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Default RTMP URL
              </label>
              <input
                type="text"
                value={form.rtmpUrl}
                onChange={(e) => setForm({ ...form, rtmpUrl: e.target.value })}
                placeholder="rtmp://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-medium text-white text-xs block">Auto Reconnect</span>
                <span className="text-[11px] text-neutral-400">Automatically retry connection on dropped packets (up to 5 attempts)</span>
              </div>
              <input
                type="checkbox"
                checked={form.autoReconnect}
                onChange={(e) => setForm({ ...form, autoReconnect: e.target.checked })}
                className="w-5 h-5 rounded accent-purple-600 bg-white/10 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Reconnect Interval (ms)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={form.reconnectInterval}
                  onChange={(e) => setForm({ ...form, reconnectInterval: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ExoPlayer Buffer Size (ms)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={form.bufferSize}
                  onChange={(e) => setForm({ ...form, bufferSize: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Video Pipeline Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <Video className="w-4 h-4" />
              <span>Video Display &amp; Scaling</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Video Scaling Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['fit', 'crop', 'original'] as ScalingMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm({ ...form, scalingMode: mode })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                      form.scalingMode === mode
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                {form.scalingMode === 'fit' && '• Fit: Preserves aspect ratio, displays letterbox bars if needed.'}
                {form.scalingMode === 'crop' && '• Crop: Scales video to completely fill the preview area.'}
                {form.scalingMode === 'original' && '• Original: Displays 1:1 pixel rendering.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Stream Orientation
                </label>
                <select
                  value={form.streamOrientation}
                  onChange={(e) => setForm({ ...form, streamOrientation: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="landscape">16:9 Landscape (TV/Broadcast)</option>
                  <option value="portrait">9:16 Portrait (Mobile/Reel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Recording Quality
                </label>
                <select
                  value={form.recordingQuality}
                  onChange={(e) => setForm({ ...form, recordingQuality: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="1080p">1080p Full HD (8 Mbps)</option>
                  <option value="720p">720p HD (4 Mbps)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Physical Camera Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Physical Camera (CameraX)</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Default Lens Direction
              </label>
              <select
                value={form.defaultCamera}
                onChange={(e) => setForm({ ...form, defaultCamera: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="environment">Back Camera (Main Lens)</option>
                <option value="user">Front Camera (Selfie)</option>
              </select>
            </div>
          </div>

          {/* Foreground & Storage */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <HardDrive className="w-4 h-4" />
              <span>Android Background Service</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-medium text-white text-xs block">Background Playback Service</span>
                <span className="text-[11px] text-neutral-400">Launch ForegroundService with persistent notification when app is backgrounded</span>
              </div>
              <input
                type="checkbox"
                checked={form.backgroundStreaming}
                onChange={(e) => setForm({ ...form, backgroundStreaming: e.target.checked })}
                className="w-5 h-5 rounded accent-purple-600 bg-white/10 cursor-pointer"
              />
            </div>
          </div>

          {/* Diagnostics & Failure Simulation (Section 15 & 21 testing) */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Diagnostic Failure Injection (Section 15 Testing)</span>
            </div>

            <select
              value={form.simulateFailure}
              onChange={(e) => setForm({ ...form, simulateFailure: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-amber-500/30 text-amber-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="none">Normal Operation (Healthy Connection)</option>
              <option value="dns_fail">Simulate DNS Lookup Failure</option>
              <option value="auth_fail">Simulate Authentication Rejection (401/403)</option>
              <option value="timeout">Simulate Network Timeout (Handshake stall)</option>
              <option value="disconnect_drop">Simulate Sudden Network Drop (Socket closed)</option>
            </select>
            <p className="text-[11px] text-neutral-400">
              Injects simulated connection errors into the RTMP state machine to verify auto-reconnect backoff and UI error alerts.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
