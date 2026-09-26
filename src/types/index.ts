export type CameraSourceType = 'physical' | 'rtmp';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'reconnecting'
  | 'connection_lost'
  | 'error';

export interface StreamInfo {
  width: number;
  height: number;
  fps: number;
  bitrateKbps: number;
  videoCodec: string;
  audioCodec: string;
  aspectRatioLabel: string;
  isPortrait: boolean;
}

export type ScalingMode = 'fit' | 'crop' | 'original';

export interface AppSettings {
  rtmpUrl: string;
  autoReconnect: boolean;
  reconnectInterval: number; // ms
  maxReconnectAttempts: number;
  bufferSize: number; // ms
  scalingMode: ScalingMode;
  maintainAspectRatio: boolean;
  preferredResolution: '1080p' | '720p' | '480p';
  recordingQuality: '1080p' | '720p';
  defaultCamera: 'environment' | 'user';
  streamOrientation: 'landscape' | 'portrait';
  simulateFailure: 'none' | 'dns_fail' | 'auth_fail' | 'timeout' | 'disconnect_drop';
  backgroundStreaming: boolean;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  timestamp: number;
  resolution: string;
  source: string;
  duration?: number; // for video in seconds
  blob?: Blob;
  filename: string;
}

export interface TestCase {
  id: number;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  detail?: string;
}
