# RTMP Virtual Camera (Android)

An Android application that allows users to use an RTMP live stream as a camera source alongside the physical device camera.

## Architecture

The project implements a clean video source abstraction pattern:

```text
               VideoSource (Interface)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
PhysicalCameraSource   RtmpVideoSource
  (Android CameraX)   (Media3 ExoPlayer + RTMP)
        │                   │
        └─────────┬─────────┘
                  ▼
          Unified SurfaceView
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  VideoRecorder       Snapshot Engine
   (MediaRecorder)     (PixelCopy / MediaStore)
```

### Key Components

- **`VideoSource`**: Interface with `start()`, `stop()`, `switch()`, and `setOutputSurface(surface: Surface)`.
- **`PhysicalCameraSource`**: Implements CameraX (`Preview`, `ImageCapture`, `VideoCapture`) with front/back camera lens switching.
- **`RtmpVideoSource`**: Media3 ExoPlayer with `RtmpDataSource.Factory` for decoding live RTMP streams.
- **`RtmpConnectionManager`**: Connection state machine with retry backoff (`Reconnecting... 1/5`), status updates, and error classification.
- **`VideoRecorder`**: Records active stream to MP4 in public `Movies/RTMPVirtualCamera` adhering to Android 10+ Scoped Storage.
- **`MediaStorageManager`**: Manages photo snapshots (`Pictures/RTMPVirtualCamera`) and video files through Android's `MediaStore` API.
- **`StreamingForegroundService`**: Maintains background playback with persistent notification and quick "Stop Streaming" action.

## Important Android Platform Limitation

> **System-wide virtual camera is not supported on this device using standard Android APIs.**
>
> Standard Android applications cannot replace the operating system's physical camera for every other third-party application. System-wide camera replacement requires platform-level OEM signatures, HAL virtual camera drivers, or device-specific capabilities. This application operates safely within supported Android APIs and permissions.

## Requirements

- Android Studio Iguana / Jellyfish / Ladybug or newer
- Android SDK 35 (minSdk 24, Android 7.0+)
- JDK 17
