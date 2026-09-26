import { StreamInfo } from '../types';

export interface VideoSourceListener {
  onStarted: () => void;
  onStopped: () => void;
  onVideoSizeChanged: (width: number, height: number) => void;
  onStreamInfoUpdated: (info: StreamInfo) => void;
  onError: (errorMessage: string, isFatal: boolean) => void;
}

export interface VideoSource {
  start(): Promise<void>;
  stop(): void;
  switch(): Promise<void>;
  setOutputCanvas(canvas: HTMLCanvasElement | null): void;
  getMediaStream(): MediaStream | null;
  isRunning: boolean;
  currentStreamInfo: StreamInfo | null;
  setListener(listener: VideoSourceListener | null): void;
}
