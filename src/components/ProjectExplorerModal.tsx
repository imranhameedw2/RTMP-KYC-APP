import React from 'react';
import { X, Folder, FileCode, Download, Copy, Check, Search, Code2 } from 'lucide-react';
import { ANDROID_PROJECT_FILES, ProjectFile } from '../androidCode/projectFiles';
import { downloadAndroidProjectZip } from '../utils/downloadProjectZip';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectExplorerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = React.useState<ProjectFile>(ANDROID_PROJECT_FILES[4]); // MainActivity or AndroidManifest
  const [search, setSearch] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [isZipping, setIsZipping] = React.useState(false);

  if (!isOpen) return null;

  const filteredFiles = ANDROID_PROJECT_FILES.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.path.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadAndroidProjectZip();
    } catch (e: any) {
      alert(`Failed to package ZIP: ${e.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1a1b20] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#21232a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                Android Studio Project Explorer
              </h2>
              <p className="text-xs text-neutral-400">
                Kotlin (SDK 35), CameraX, Media3 ExoPlayer &amp; Material 3 Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isZipping ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace split */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* File Tree / List */}
          <div className="md:col-span-4 bg-[#141518] border-r border-white/5 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3 h-3 text-purple-400" />
                <span>Project Root</span>
              </div>
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-neutral-400'}`} />
                    <span className="truncate">{file.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="md:col-span-8 bg-[#0f1013] flex flex-col overflow-hidden">
            {/* File Path Header */}
            <div className="px-5 py-2.5 bg-[#18191e] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400">File:</span>
                <span className="font-mono text-purple-300 text-xs font-semibold">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                  {selectedFile.language}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Content Pre */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-200 leading-relaxed selection:bg-purple-600/40">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
