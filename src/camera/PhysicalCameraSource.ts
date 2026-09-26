import { StreamInfo } from '../types';
import { VideoSource, VideoSourceListener } from './VideoSource';

export class PhysicalCameraSource implements VideoSource {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private outputCanvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private facingMode: 'user' | 'environment' = 'environment';
  private listener: VideoSourceListener | null = null;

  public isRunning: boolean = false;
  public currentStreamInfo: StreamInfo | null = null;

  private frameCount: number = 0;
  private lastFpsTimestamp: number = 0;
  private currentFps: number = 30;

  constructor(defaultFacing: 'user' | 'environment' = 'environment') {
    this.facingMode = defaultFacing;
  }

  setListener(listener: VideoSourceListener | null): void {
    this.listener = listener;
  }

  setOutputCanvas(canvas: HTMLCanvasElement | null): void {
    this.outputCanvas = canvas;
  }

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  async start(): Promise<void> {
    try {
      this.stop();

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) is not supported in this environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        // If audio fails or is denied, retry with video only
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: constraints.video
        });
      }

      this.videoElement = document.createElement('video');
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      const track = this.mediaStream.getVideoTracks()[0];
      const settings = track.getSettings();
      const width = settings.width || 1280;
      const height = settings.height || 720;
      const isPortrait = height > width;

      this.currentStreamInfo = {
        width,
        height,
        fps: Math.round(settings.frameRate || 30),
        bitrateKbps: 12000,
        videoCodec: `CameraX (Lens: ${this.facingMode === 'user' ? 'Front' : 'Back'})`,
        audioCodec: this.mediaStream.getAudioTracks().length > 0 ? 'AAC 48kHz' : 'None',
        aspectRatioLabel: isPortrait ? '9:16 Portrait' : '16:9 Landscape',
        isPortrait
      };

      this.isRunning = true;
      this.listener?.onStarted();
      this.listener?.onVideoSizeChanged(width, height);
      this.listener?.onStreamInfoUpdated(this.currentStreamInfo);

      this.startRenderLoop();
    } catch (error: any) {
      this.isRunning = false;
      let msg = error.message || 'Failed to open physical camera.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied by user. Please allow camera access in browser permissions.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        msg = 'No physical camera hardware detected on this device.';
      }
      this.listener?.onError(msg, true);
      throw error;
    }
  }

  async switch(): Promise<void> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.isRunning) {
      await this.start();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.listener?.onStopped();
  }

  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      if (!this.isRunning || !this.videoElement) return;

      // FPS tracking
      this.frameCount++;
      if (timestamp - this.lastFpsTimestamp >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTimestamp = timestamp;
        if (this.currentStreamInfo) {
          this.currentStreamInfo.fps = this.currentFps;
          this.listener?.onStreamInfoUpdated({ ...this.currentStreamInfo });
        }
      }

      if (this.outputCanvas && this.videoElement.videoWidth > 0) {
        const ctx = this.outputCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(this.videoElement, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
        }
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.lastFpsTimestamp = performance.now();
    this.frameCount = 0;
    this.animationFrameId = requestAnimationFrame(render);
  }
}
