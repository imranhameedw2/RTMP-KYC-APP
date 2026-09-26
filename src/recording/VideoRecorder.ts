export interface VideoRecorderListener {
  onStarted: () => void;
  onStopped: (blob: Blob, durationSeconds: number) => void;
  onError: (error: string) => void;
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: any = null;
  public isRecording: boolean = false;
  private listener: VideoRecorderListener | null = null;

  setListener(listener: VideoRecorderListener | null) {
    this.listener = listener;
  }

  start(stream: MediaStream): boolean {
    if (this.isRecording) return false;

    try {
      this.recordedChunks = [];
      const mimeType = this.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 6000000
      });

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const blob = new Blob(this.recordedChunks, {
          type: mimeType || 'video/webm'
        });
        this.listener?.onStopped(blob, duration);
      };

      this.mediaRecorder.onerror = (e: any) => {
        this.listener?.onError(e.error?.message || 'MediaRecorder failed');
      };

      this.mediaRecorder.start(500); // 500ms chunk slices
      this.startTime = Date.now();
      this.isRecording = true;
      this.listener?.onStarted();
      return true;
    } catch (err: any) {
      this.listener?.onError(`Cannot start recording: ${err.message}`);
      return false;
    }
  }

  stop(): void {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.isRecording = false;
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }
}
