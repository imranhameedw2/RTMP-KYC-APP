import React from 'react';
import { X, Image as ImageIcon, Video as VideoIcon, Download, Trash2, Play } from 'lucide-react';
import { MediaItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  onDeleteItem: (id: string) => void;
}

export const GalleryDrawer: React.FC<Props> = ({ isOpen, onClose, items, onDeleteItem }) => {
  const [selectedItem, setSelectedItem] = React.useState<MediaItem | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1b1c22] border-l border-white/10 w-full max-w-md h-full shadow-2xl flex flex-col text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#21232a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Media Gallery</h3>
              <p className="text-[11px] text-neutral-400">Captured Photos &amp; Video Recordings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <ImageIcon className="w-10 h-10 mb-2 stroke-1 text-neutral-500" />
              <p className="text-xs font-medium text-neutral-300">No media captured yet</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Press &quot;CAPTURE PHOTO&quot; or &quot;RECORD&quot; during live camera or RTMP stream playback.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-center group hover:border-purple-500/40 transition-all"
              >
                {/* Thumbnail / Preview */}
                <div
                  onClick={() => setSelectedItem(item)}
                  className="w-16 h-16 rounded-lg bg-black/60 relative overflow-hidden shrink-0 cursor-pointer flex items-center justify-center border border-white/10"
                >
                  {item.type === 'photo' ? (
                    <img src={item.url} alt="Snap" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      <Play className="w-5 h-5 fill-current" />
                      <span className="text-[9px] font-mono mt-0.5">{item.duration ? `${Math.round(item.duration)}s` : 'MP4'}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.type === 'photo' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">Photo</span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase">Video</span>
                    )}
                    <span className="text-xs font-medium text-white truncate">{item.filename}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {item.resolution} • {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-[10px] text-purple-300 font-mono truncate">{item.source}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <a
                    href={item.url}
                    download={item.filename}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-600 text-neutral-300 hover:text-white transition-colors"
                    title="Download Media File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600 text-neutral-300 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Media Lightbox Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-60 bg-black/90 flex flex-col p-4">
            <div className="flex justify-between items-center pb-2">
              <span className="text-xs font-mono text-neutral-300">{selectedItem.filename}</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {selectedItem.type === 'photo' ? (
                <img
                  src={selectedItem.url}
                  alt="Full view"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-lg"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
