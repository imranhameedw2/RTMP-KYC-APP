import React from 'react';
import { X, Smartphone, Download, QrCode, Terminal, Check, Copy, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDownloadProjectZip: () => void;
}

export const ApkDownloadModal: React.FC<Props> = ({ isOpen, onClose, onDownloadProjectZip }) => {
  const [activeTab, setActiveTab] = React.useState<'instant' | 'studio' | 'github'>('instant');
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [copiedCmd, setCopiedCmd] = React.useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // App URL for mobile testing
  const appUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost')
        ? 'https://ais-pre-omll42vhe4ak66mdww4sxg-773717575519.asia-southeast1.run.app'
        : window.location.href)
    : 'https://ais-pre-omll42vhe4ak66mdww4sxg-773717575519.asia-southeast1.run.app';

  React.useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('./gradlew assembleDebug');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1a1b22] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#21232d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                Download APK &amp; Test on Phone
              </h2>
              <p className="text-xs text-neutral-400">
                Install as Android WebAPK or build native debug APK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#16171d] px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('instant')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'instant'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. Instant Phone Install (WebAPK)</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. Android Studio APK</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Cloud CI Build</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-300">
          {/* TAB 1: INSTANT PHONE INSTALLATION */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 leading-relaxed">
                <strong className="text-white">Fastest way to test on your phone:</strong> Android automatically generates a signed system <strong>WebAPK</strong> when you open this link on your phone and tap <em>Install</em>. It runs in full screen with direct access to physical front/back cameras and the RTMP video engine!
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="bg-white p-2.5 rounded-2xl shadow-xl shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Scan to test on phone" className="w-40 h-40 rounded-lg" />
                  ) : (
                    <div className="w-40 h-40 bg-neutral-200 rounded-lg animate-pulse" />
                  )}
                </div>

                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Scan with your Android camera:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                    <li>Point your phone&apos;s camera at the QR code.</li>
                    <li>Tap the popup link to open in Chrome or browser.</li>
                    <li>Tap <strong>&ldquo;Install App&rdquo;</strong> or menu &rarr; <em>Add to Home screen</em>.</li>
                  </ol>

                  {/* Copy URL */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied URL!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Install Button if browser supports beforeinstallprompt */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">Install Directly onto this Device</h4>
                    <p className="text-neutral-400 text-[11px]">Ready to install as standalone Android application</p>
                  </div>
                  <button
                    onClick={install}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    Install Now
                  </button>
                </div>
              )}

              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero sideloading or Developer Mode required. Works on all modern Android devices.</span>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID STUDIO NATIVE APK */}
          {activeTab === 'studio' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Build Native Android APK (.apk)</h4>
                <p className="text-neutral-300">
                  The complete Android Studio Kotlin project is ready. You can build the signed or debug APK in less than 30 seconds using Android Studio or command line.
                </p>
              </div>

              {/* Download project zip button */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Step 1: Download Android Project Package</h4>
                  <p className="text-neutral-400 text-[11px]">Includes all Kotlin sources, Media3, CameraX, and Gradle scripts</p>
                </div>
                <button
                  onClick={onDownloadProjectZip}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Project (.ZIP)</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-purple-400">
                  Step 2: Generate APK in Android Studio
                </h4>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
                  <p>1. Extract the ZIP and open the folder in <strong>Android Studio</strong>.</p>
                  <p>2. In the top menu, click: <code className="text-purple-300 bg-white/10 px-1 py-0.5 rounded font-mono">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</code></p>
                  <p>3. Android Studio generates your APK in: <br /><code className="text-emerald-400 font-mono text-[10px] break-all">app/build/outputs/apk/debug/app-debug.apk</code></p>
                </div>
              </div>

              {/* Terminal command */}
              <div className="space-y-1.5">
                <span className="font-bold text-white text-xs uppercase tracking-wider text-purple-400">
                  Or via Command Line:
                </span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-purple-300">
                  <span>./gradlew assembleDebug</span>
                  <button
                    onClick={handleCopyCmd}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB ACTIONS CLOUD CI */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Automated Cloud APK Build (GitHub Actions)</h4>
                <p className="text-neutral-300">
                  A GitHub Actions workflow (<code className="text-purple-300 font-mono">.github/workflows/build-apk.yml</code>) has been added to the repository.
                </p>
              </div>

              <div className="space-y-2 text-neutral-300">
                <p>When you push this repository to GitHub:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-2 text-neutral-400">
                  <li>GitHub automatically provisions an Ubuntu runner with JDK 17 &amp; Android SDK.</li>
                  <li>It runs <code className="text-purple-300 font-mono">./gradlew assembleDebug</code>.</li>
                  <li>The compiled <strong className="text-white">app-debug.apk</strong> is uploaded under the <strong>Actions &gt; Artifacts</strong> tab for instant 1-click download directly to your phone!</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-neutral-400">
                <div className="text-purple-400 font-bold mb-1">// Workflow Trigger:</div>
                <div>git add . &amp;&amp; git commit -m &quot;Build APK&quot;</div>
                <div>git push origin main</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#16171d] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Package: <code className="text-purple-300 font-mono">com.example.rtmpvirtualcamera</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
