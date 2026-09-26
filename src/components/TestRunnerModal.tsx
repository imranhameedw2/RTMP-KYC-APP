import React from 'react';
import { X, Play, CheckCircle, AlertCircle, RefreshCw, Terminal, Check } from 'lucide-react';
import { TestCase } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExecuteTest: (testId: number) => Promise<{ success: boolean; detail: string }>;
}

const INITIAL_TESTS: TestCase[] = [
  { id: 1, name: 'Valid RTMP URL', description: 'Validate rtmp://... and rtmps://... URI parsing and handshake initiation.', status: 'idle' },
  { id: 2, name: 'Invalid RTMP URL', description: 'Ensure malformed strings and non-rtmp schemes are rejected with error.', status: 'idle' },
  { id: 3, name: 'Server Offline', description: 'Verify handling when port 1935 is unreachable / server refuses connection.', status: 'idle' },
  { id: 4, name: 'Network Interruption', description: 'Simulate unexpected connection drop during active live video stream.', status: 'idle' },
  { id: 5, name: 'Reconnection Cycle', description: 'Verify auto-reconnection count (1/5 ... 5/5) and backoff delay.', status: 'idle' },
  { id: 6, name: 'Real Camera Switching', description: 'Test switching between physical Front and Back camera lenses (CameraX).', status: 'idle' },
  { id: 7, name: 'RTMP Source Switching', description: 'Verify seamless handoff between Physical Camera and RTMP Stream sources.', status: 'idle' },
  { id: 8, name: 'Portrait Stream (9:16)', description: 'Validate vertical stream aspect ratio, no stretching, correct resolution.', status: 'idle' },
  { id: 9, name: 'Landscape Stream (16:9)', description: 'Validate standard widescreen broadcast stream rendering and bounds.', status: 'idle' },
  { id: 10, name: 'Video Recording (MP4)', description: 'Test MediaRecorder pipeline capture, encoding, and media store URI output.', status: 'idle' },
  { id: 11, name: 'Snapshot Frame Capture', description: 'Test PixelCopy frame grab and JPEG storage to Pictures/RTMPVirtualCamera.', status: 'idle' },
  { id: 12, name: 'Background / Foreground', description: 'Verify foreground service notification trigger and stream continuation.', status: 'idle' },
  { id: 13, name: 'Permission Denial Handling', description: 'Verify graceful fallback and alert when CAMERA permission is rejected.', status: 'idle' },
  { id: 14, name: 'Android Lifecycle Events', description: 'Test onPause/onResume surface destruction and safe reconnection.', status: 'idle' },
];

export const TestRunnerModal: React.FC<Props> = ({ isOpen, onClose, onExecuteTest }) => {
  const [tests, setTests] = React.useState<TestCase[]>(INITIAL_TESTS);
  const [isRunningAll, setIsRunningAll] = React.useState(false);
  const [activeLog, setActiveLog] = React.useState<string[]>([
    'RTMP Virtual Camera Android Test Harness ready.',
    'Click "Run All Tests" or trigger individual test scenarios.'
  ]);

  if (!isOpen) return null;

  const appendLog = (msg: string) => {
    setActiveLog((prev) => [...prev.slice(-40), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSingleTest = async (testId: number) => {
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'running', detail: 'Executing...' } : t))
    );
    const target = tests.find((t) => t.id === testId);
    appendLog(`Running test #${testId}: ${target?.name}...`);

    try {
      const result = await onExecuteTest(testId);
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? { ...t, status: result.success ? 'passed' : 'failed', detail: result.detail }
            : t
        )
      );
      appendLog(
        result.success
          ? `✔ PASSED: ${target?.name} - ${result.detail}`
          : `✖ FAILED: ${target?.name} - ${result.detail}`
      );
    } catch (e: any) {
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: 'failed', detail: e.message || 'Error occurred' } : t
        )
      );
      appendLog(`✖ EXCEPTION in #${testId}: ${e.message}`);
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    appendLog('Starting full test sequence (14 scenarios)...');
    for (const test of tests) {
      await runSingleTest(test.id);
      await new Promise((r) => setTimeout(r, 200));
    }
    setIsRunningAll(false);
    appendLog('All test scenarios finished.');
  };

  const resetTests = () => {
    setTests(INITIAL_TESTS);
    setActiveLog(['Test states reset.']);
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1e1f25] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#252730]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Section 21: Test &amp; Verification Suite
              </h2>
              <p className="text-xs text-neutral-400">
                14 Functional and Lifecycle Tests for RTMP &amp; Camera Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar summary */}
        <div className="px-6 py-3 bg-[#191a20] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-neutral-400">Total: {tests.length}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {passedCount} Passed
            </span>
            {failedCount > 0 && (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {failedCount} Failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetTests}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunningAll ? 'Running...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Body: Split into Test List & Live Log */}
        <div className="grid grid-cols-1 md:grid-cols-5 flex-1 overflow-hidden">
          {/* Test items */}
          <div className="md:col-span-3 p-4 overflow-y-auto space-y-2 border-r border-white/5">
            {tests.map((test) => (
              <div
                key={test.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-purple-400 text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded">
                      #{test.id}
                    </span>
                    <span className="font-semibold text-white truncate">{test.name}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">{test.description}</p>
                  {test.detail && (
                    <p
                      className={`text-[11px] mt-1 font-mono ${
                        test.status === 'passed' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {test.detail}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {test.status === 'idle' && (
                    <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-1 rounded-md">
                      Idle
                    </span>
                  )}
                  {test.status === 'running' && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Testing...
                    </span>
                  )}
                  {test.status === 'passed' && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Passed
                    </span>
                  )}
                  {test.status === 'failed' && (
                    <span className="text-[10px] text-rose-400 bg-rose-400/10 px-2 py-1 rounded-md flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3 text-rose-400" /> Failed
                    </span>
                  )}

                  <button
                    onClick={() => runSingleTest(test.id)}
                    disabled={test.status === 'running' || isRunningAll}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-purple-600 hover:text-white text-neutral-300 transition-colors disabled:opacity-30"
                    title="Run Test"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Test Console Log */}
          <div className="md:col-span-2 p-3 bg-[#131418] flex flex-col font-mono text-[11px]">
            <div className="text-neutral-400 pb-2 border-b border-white/5 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-purple-400" />
              <span>Diagnostic Console</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pt-2 text-neutral-300">
              {activeLog.map((line, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed break-all ${
                    line.includes('PASSED')
                      ? 'text-emerald-400'
                      : line.includes('FAILED') || line.includes('EXCEPTION')
                      ? 'text-rose-400'
                      : 'text-neutral-400'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#191a20] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
