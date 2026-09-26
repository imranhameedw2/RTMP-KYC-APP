import React from 'react';
import { ShieldAlert, CheckCircle2, X, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VirtualCameraInfoDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1e1f25] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#252730]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">About Virtual Camera</h2>
              <p className="text-xs text-neutral-400">Android Platform Architecture &amp; Security Boundary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Main Notice Box */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 leading-relaxed font-medium">
            &ldquo;RTMP Camera mode provides an RTMP stream as a camera/video source inside this application. Standard Android applications cannot replace the operating system&apos;s physical camera for every other application. System-wide camera replacement requires platform-level support or device-specific capabilities.&rdquo;
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>Official Android Compliance:</strong> This application strictly adheres to Android security guidelines. It does NOT use root exploits, system framework patching, SELinux circumvention, or hidden camera hooks.
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2 text-xs uppercase tracking-wider text-neutral-400">How It Works in This Application</h3>
            <div className="space-y-2 text-neutral-300 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Unified VideoSource API:</strong> <code className="text-purple-300 bg-white/5 px-1 py-0.5 rounded">PhysicalCameraSource</code> (CameraX) and <code className="text-purple-300 bg-white/5 px-1 py-0.5 rounded">RtmpVideoSource</code> (Media3 ExoPlayer) implement the exact same interface.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Application Camera Feeds:</strong> The decoded RTMP stream acts as a full-featured camera input for previewing, snapshot capturing, and MP4 recording inside the app.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard Android Permissions:</strong> Explicit user prompts for CAMERA, RECORD_AUDIO, and FOREGROUND_SERVICE without security bypasses.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#191a20] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors shadow-lg shadow-purple-600/20"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
