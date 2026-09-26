package com.example.rtmpvirtualcamera.recording

import android.content.Context
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.view.Surface
import com.example.rtmpvirtualcamera.storage.MediaStorageManager
import java.io.FileDescriptor

/**
 * Handles recording the active camera or RTMP video source to an MP4 video file.
 * Integrates with Android's MediaRecorder and Scoped Storage MediaStore.
 */
class VideoRecorder(
    private val context: Context,
    private val storageManager: MediaStorageManager
) {
    enum class State {
        IDLE,
        RECORDING,
        STOPPED,
        ERROR
    }

    interface Listener {
        fun onRecordingStarted(outputUri: Uri)
        fun onRecordingStopped(outputUri: Uri, durationSeconds: Long)
        fun onError(message: String)
    }

    private var recorder: MediaRecorder? = null
    private var currentOutputUri: Uri? = null
    private var startTimeMs: Long = 0
    private var listener: Listener? = null
    var currentState: State = State.IDLE
        private set

    fun setListener(listener: Listener?) {
        this.listener = listener
    }

    /**
     * Prepares and starts the MP4 recording pipeline.
     */
    fun startRecording(
        width: Int = 1920,
        height: Int = 1080,
        bitrate: Int = 8000000,
        frameRate: Int = 30,
        includeAudio: Boolean = true
    ): Surface? {
        if (currentState == State.RECORDING) {
            listener?.onError("Already recording")
            return null
        }

        try {
            val (uri, _) = storageManager.createVideoMediaUri()
            if (uri == null) {
                listener?.onError("Could not allocate media storage Uri")
                return null
            }
            currentOutputUri = uri

            val pfd = context.contentResolver.openFileDescriptor(uri, "rw")
            val fd: FileDescriptor = pfd?.fileDescriptor
                ?: throw IllegalStateException("Cannot open file descriptor")

            recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                if (includeAudio) {
                    try {
                        setAudioSource(MediaRecorder.AudioSource.MIC)
                    } catch (_: Exception) {
                        // Continue video-only if audio source fails
                    }
                }
                setVideoSource(MediaRecorder.VideoSource.SURFACE)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)

                setVideoEncoder(MediaRecorder.VideoEncoder.H264)
                if (includeAudio) {
                    try {
                        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                        setAudioEncodingBitRate(128000)
                        setAudioSamplingRate(44100)
                    } catch (_: Exception) {}
                }

                setVideoSize(width, height)
                setVideoFrameRate(frameRate)
                setVideoEncodingBitRate(bitrate)
                setOutputFile(fd)
                prepare()
                start()
            }

            startTimeMs = System.currentTimeMillis()
            currentState = State.RECORDING
            listener?.onRecordingStarted(uri)

            return recorder?.surface
        } catch (e: Exception) {
            currentState = State.ERROR
            listener?.onError("Failed to start recorder: ${e.message}")
            release()
            return null
        }
    }

    fun stopRecording() {
        if (currentState != State.RECORDING) return

        try {
            recorder?.stop()
            val duration = (System.currentTimeMillis() - startTimeMs) / 1000
            currentOutputUri?.let { uri ->
                storageManager.finishVideoPending(uri)
                listener?.onRecordingStopped(uri, duration)
            }
        } catch (e: Exception) {
            listener?.onError("Error stopping recording: ${e.message}")
        } finally {
            currentState = State.STOPPED
            release()
        }
    }

    private fun release() {
        recorder?.reset()
        recorder?.release()
        recorder = null
        if (currentState != State.RECORDING) {
            currentState = State.IDLE
        }
    }
}
