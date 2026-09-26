import { AppSettings, ConnectionState, StreamInfo } from '../types';
import { VideoSource, VideoSourceListener } from './VideoSource';

export class RtmpVideoSource implements VideoSource {
  private url: string = '';
  private settings: AppSettings;
  private listener: VideoSourceListener | null = null;
  private outputCanvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;

  public isRunning: boolean = false;
  public connectionState: ConnectionState = 'disconnected';
  public currentStreamInfo: StreamInfo | null = null;
  public currentReconnectAttempt: number = 0;

  private canvasStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;

  private frameCount: number = 0;
  private lastFpsTimestamp: number = 0;
  private currentFps: number = 30;
  private reconnectTimeoutId: any = null;

  constructor(url: string, settings: AppSettings) {
    this.url = url;
    this.settings = settings;
  }

  setUrl(url: string) {
    this.url = url;
  }

  setSettings(settings: AppSettings) {
    this.settings = settings;
  }

  setListener(listener: VideoSourceListener | null): void {
    this.listener = listener;
  }

  setOutputCanvas(canvas: HTMLCanvasElement | null): void {
    this.outputCanvas = canvas;
  }

  getMediaStream(): MediaStream | null {
    return this.canvasStream;
  }

  validateUrl(url: string): boolean {
    const trimmed = url.trim();
    if (!trimmed.startsWith('rtmp://') && !trimmed.startsWith('rtmps://')) {
      return false;
    }
    // Must contain a hostname
    const match = trimmed.match(/^rtmps?:\/\/([^\/\s:]+)/i);
    return !!match && match[1].length > 0;
  }

  async start(): Promise<void> {
    if (!this.validateUrl(this.url)) {
      this.connectionState = 'error';
      this.listener?.onError('Invalid RTMP URL format. Must start with rtmp:// or rtmps://', true);
      throw new Error('Invalid RTMP URL format');
    }

    this.cancelReconnect();
    this.currentReconnectAttempt = 0;
    this.connectionState = 'connecting';

    // Simulate realistic network connection delay (e.g. TCP handshake + RTMP connect chunk)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check simulated failure conditions
    if (this.settings.simulateFailure === 'dns_fail' || this.url.includes('dns-error')) {
      this.connectionState = 'error';
      this.listener?.onError('DNS lookup failed. Host could not be resolved.', true);
      return;
    }
    if (this.settings.simulateFailure === 'auth_fail' || this.url.includes('invalid-key')) {
      this.connectionState = 'error';
      this.listener?.onError('RTMP authentication rejected. Check credentials or stream key.', true);
      return;
    }
    if (this.settings.simulateFailure === 'timeout' || this.url.includes('timeout')) {
      this.connectionState = 'error';
      this.listener?.onError('Connection timed out waiting for RTMP handshake.', true);
      return;
    }

    this.connectionState = 'connected';
    await new Promise((resolve) => setTimeout(resolve, 400));

    this.connectionState = 'streaming';
    this.isRunning = true;

    const isPortrait = this.settings.streamOrientation === 'portrait';
    const width = isPortrait ? 1080 : 1920;
    const height = isPortrait ? 1920 : 1080;

    this.currentStreamInfo = {
      width,
      height,
      fps: 30,
      bitrateKbps: 4500,
      videoCodec: 'H.264 / AVC (High@L4.1)',
      audioCodec: 'AAC-LC (Stereo, 48kHz, 160kbps)',
      aspectRatioLabel: isPortrait ? '9:16 Portrait' : '16:9 Landscape',
      isPortrait
    };

    this.setupAudio();
    this.setupStreamCapture();

    this.listener?.onStarted();
    this.listener?.onVideoSizeChanged(width, height);
    this.listener?.onStreamInfoUpdated(this.currentStreamInfo);

    this.startRenderingLoop();
  }

  private setupAudio() {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.audioDestination = this.audioCtx.createMediaStreamDestination();
        this.oscillator = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        // Very low volume ambient tone for live RTMP broadcast audio track
        gain.gain.value = 0.02;
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = 440;
        this.oscillator.connect(gain);
        gain.connect(this.audioDestination);
        this.oscillator.start();
      }
    } catch {
      // Audio optional
    }
  }

  private setupStreamCapture() {
    if (this.outputCanvas) {
      try {
        const stream = this.outputCanvas.captureStream(30);
        if (this.audioDestination) {
          const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        }
        this.canvasStream = stream;
      } catch {
        // Fallback
      }
    }
  }

  stop(): void {
    this.cancelReconnect();
    this.isRunning = false;
    this.connectionState = 'disconnected';

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {}
      this.oscillator = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }

    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((t) => t.stop());
      this.canvasStream = null;
    }

    this.listener?.onStopped();
  }

  async switch(): Promise<void> {
    // Toggles orientation or bitstream quality profile
    this.settings.streamOrientation = this.settings.streamOrientation === 'landscape' ? 'portrait' : 'landscape';
    if (this.isRunning) {
      this.stop();
      await this.start();
    }
  }

  handleDisconnect(reason: string = 'Network connection dropped by remote peer') {
    this.isRunning = false;
    this.connectionState = 'connection_lost';
    this.listener?.onError(reason, false);

    if (this.settings.autoReconnect && this.currentReconnectAttempt < this.settings.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.connectionState = 'error';
    }
  }

  private scheduleReconnect() {
    this.cancelReconnect();
    this.currentReconnectAttempt++;
    this.connectionState = 'reconnecting';

    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        await this.start();
      } catch {
        if (this.currentReconnectAttempt >= this.settings.maxReconnectAttempts) {
          this.connectionState = 'error';
          this.listener?.onError(`Reconnection failed after ${this.settings.maxReconnectAttempts} attempts`, true);
        } else {
          this.scheduleReconnect();
        }
      }
    }, this.settings.reconnectInterval);
  }

  cancelReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private startRenderingLoop(): void {
    const isPortrait = this.settings.streamOrientation === 'portrait';
    const canvasWidth = isPortrait ? 720 : 1280;
    const canvasHeight = isPortrait ? 1280 : 720;

    const render = (time: number) => {
      if (!this.isRunning || !this.outputCanvas) return;

      const canvas = this.outputCanvas;
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.renderLiveBroadcastPattern(ctx, canvasWidth, canvasHeight, time);
      }

      // Track FPS
      this.frameCount++;
      if (time - this.lastFpsTimestamp >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTimestamp = time;
        if (this.currentStreamInfo) {
          this.currentStreamInfo.fps = this.currentFps;
          // Slight realistic bitrate jitter (±5%)
          this.currentStreamInfo.bitrateKbps = Math.round(4500 + Math.sin(time / 500) * 220);
          this.listener?.onStreamInfoUpdated({ ...this.currentStreamInfo });
        }
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.lastFpsTimestamp = performance.now();
    this.frameCount = 0;
    this.animationFrameId = requestAnimationFrame(render);
  }

  private renderLiveBroadcastPattern(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number
  ) {
    // 1. Background gradient (Studio cyber / broadcast aesthetic)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0c1017');
    bgGrad.addColorStop(0.5, '#161c28');
    bgGrad.addColorStop(1, '#080a0f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. SMPTE Color bar section at top/middle
    const barHeight = h * 0.35;
    const barY = h * 0.18;
    const colors = ['#f0f0f0', '#dede00', '#00dede', '#00de00', '#de00de', '#de0000', '#0000de'];
    const barWidth = w / colors.length;

    colors.forEach((col, idx) => {
      ctx.fillStyle = col;
      ctx.fillRect(idx * barWidth, barY, barWidth, barHeight);
    });

    // Sub-bars
    const subBarY = barY + barHeight;
    const subBarH = h * 0.08;
    const subColors = ['#0000de', '#111111', '#de00de', '#111111', '#00dede', '#111111', '#f0f0f0'];
    subColors.forEach((col, idx) => {
      ctx.fillStyle = col;
      ctx.fillRect(idx * barWidth, subBarY, barWidth, subBarH);
    });

    // 3. Animated circular radar / scanline
    const cx = w / 2;
    const cy = h / 2;
    const pulseRadius = 50 + Math.abs(Math.sin(time / 600)) * 25;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ffd0';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Orbiting data point
    const angle = (time / 1000) * 2;
    const orbX = cx + Math.cos(angle) * (pulseRadius + 15);
    const orbY = cy + Math.sin(angle) * (pulseRadius + 15);
    ctx.beginPath();
    ctx.arc(orbX, orbY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2d55';
    ctx.fill();

    // 4. Moving scanline
    const scanlineY = (time * 0.25) % h;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, scanlineY, w, 4);

    // 5. Audio VU meter animation at the bottom
    const meterY = h - 140;
    const numBars = 24;
    const mBarWidth = (w - 80) / numBars;
    for (let i = 0; i < numBars; i++) {
      const freq = Math.sin(time * 0.005 + i * 0.4) * 0.5 + 0.5;
      const barH = 10 + freq * 40;
      const hue = 120 - freq * 120; // Green to red
      ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
      ctx.fillRect(40 + i * mBarWidth, meterY + (50 - barH), mBarWidth - 4, barH);
    }

    // 6. Professional Broadcast Watermark & Header
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, 60);

    // Live Badge
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.arc(36, 30, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Roboto Mono", monospace';
    ctx.fillText('LIVE RTMP INGEST', 54, 36);

    // Live millisecond timecode
    const now = new Date();
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const timecode = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
    ctx.fillStyle = '#00ffd0';
    ctx.font = 'bold 18px "Roboto Mono", monospace';
    const tcWidth = ctx.measureText(timecode).width;
    ctx.fillText(timecode, w - tcWidth - 24, 36);

    // 7. Stream Information Overlay at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, h - 70, w, 70);

    ctx.fillStyle = '#a0aec0';
    ctx.font = '12px "Roboto", sans-serif';
    ctx.fillText('RTMP VIRTUAL CAMERA SOURCE', 24, h - 45);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Roboto Mono", monospace';
    const displayUrl = this.url.length > 50 ? this.url.slice(0, 48) + '...' : this.url;
    ctx.fillText(displayUrl, 24, h - 22);

    const statsText = `${this.currentStreamInfo?.width}x${this.currentStreamInfo?.height} @ ${this.currentFps} FPS | ${this.currentStreamInfo?.bitrateKbps} kbps`;
    const statsWidth = ctx.measureText(statsText).width;
    ctx.fillStyle = '#00ffd0';
    ctx.fillText(statsText, w - statsWidth - 24, h - 22);
  }
}
