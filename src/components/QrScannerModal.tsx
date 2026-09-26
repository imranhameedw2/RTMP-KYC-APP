import React from 'react';
import { X, QrCode, Camera, RefreshCw, Upload, CheckCircle2, Sparkles, Flashlight, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
}

const SAMPLE_QR_CODES = [
  { label: 'LAN Ingest', url: 'rtmp://192.168.1.120:1935/live/cam1' },
  { label: 'OBS Studio', url: 'rtmp://live.obs.broadcast:1935/app/streamKey_9481' },
  { label: 'Secure RTMPS', url: 'rtmps://secure-stream.cdn.net:443/live/channelA' }
];

export const QrScannerModal: React.FC<Props> = ({ isOpen, onClose, onScan }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = React.useState(false);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [detectedUrl, setDetectedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setDetectedUrl(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setIsScanning(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      if (capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanLoop();
      }
    } catch (err: any) {
      setIsScanning(false);
      let msg = err.message || 'Failed to start camera for QR scanning.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. You can select a sample QR code below or upload an image.';
      }
      setErrorMsg(msg);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch {
      // ignore
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleSuccessfulScan = (code: string) => {
    setDetectedUrl(code);
    stopCamera();

    // Trigger visual/vibration confirmation
    if (navigator.vibrate) {
      try { navigator.vibrate(100); } catch {}
    }

    setTimeout(() => {
      onScan(code);
      onClose();
    }, 600);
  };

  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data && code.data.trim()) {
          handleSuccessfulScan(code.data.trim());
          return;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  // Image file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleSuccessfulScan(code.data.trim());
        } else {
          setErrorMsg('No valid QR code found in uploaded image. Please try another file.');
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1a1b22] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#21232d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Scan RTMP QR Code</h3>
              <p className="text-[11px] text-neutral-400">Point at monitor, OBS, or streaming encoder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Overlay Graphics */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened mask around reticle */}
            <div className="relative w-64 h-64 border-2 border-purple-500/60 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-xl" />

              {/* Laser scanning bar animation */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#a855f7] animate-[bounce_2s_infinite]" />
            </div>
          </div>

          {/* Torch & Camera flip controls over camera view */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
            {hasTorch ? (
              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all ${
                  torchOn ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40' : 'bg-black/60 text-white'
                }`}
                title="Toggle Flashlight"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            ) : <div />}

            <button
              onClick={switchCamera}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all shadow-md active:scale-95"
              title="Switch Lens"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Success Detected Overlay */}
          {detectedUrl && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-150">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <h4 className="font-bold text-white text-base">QR Code Detected!</h4>
              <p className="font-mono text-xs text-emerald-200 mt-1 break-all bg-black/40 p-2 rounded-lg border border-emerald-500/30 max-w-xs">
                {detectedUrl}
              </p>
            </div>
          )}

          {/* Error / Permission Overlay */}
          {errorMsg && !detectedUrl && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
              <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
              <p className="text-xs text-rose-200 font-medium max-w-xs">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Quick Test Presets & File Upload */}
        <div className="p-4 bg-[#1e2028] border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 font-semibold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulated QR Code Presets:</span>
            </span>
            <label className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload QR Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_QR_CODES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSuccessfulScan(preset.url)}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/40 text-left transition-all group"
              >
                <span className="block text-[11px] font-bold text-white group-hover:text-purple-300">
                  {preset.label}
                </span>
                <span className="block text-[9px] font-mono text-neutral-400 truncate mt-0.5">
                  {preset.url.replace(/^rtmps?:\/\//, '')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
