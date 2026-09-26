package com.example.rtmpvirtualcamera.camera

import android.content.Context
import android.view.Surface
import androidx.media3.common.Format
import androidx.media3.common.PlaybackException
import com.example.rtmpvirtualcamera.rtmp.RtmpConnectionManager
import com.example.rtmpvirtualcamera.rtmp.RtmpPlayer
import com.example.rtmpvirtualcamera.rtmp.StreamInfo

/**
 * Implementation of VideoSource that decodes an RTMP live stream
 * and feeds frames into the application's video pipeline.
 */
class RtmpVideoSource(
    private val context: Context,
    var streamUrl: String = "",
    val connectionManager: RtmpConnectionManager = RtmpConnectionManager()
) : VideoSource {

    private var player: RtmpPlayer? = null
    private var outputSurface: Surface? = null
    private var listener: VideoSourceListener? = null

    private var _isRunning: Boolean = false
    override val isRunning: Boolean get() = _isRunning

    private var _streamInfo: StreamInfo? = null
    override val currentStreamInfo: StreamInfo? get() = _streamInfo

    init {
        connectionManager.setStateListener(object : RtmpConnectionManager.StateListener {
            override fun onStateChanged(state: RtmpConnectionManager.State) {
                when (state) {
                    RtmpConnectionManager.State.CONNECTED,
                    RtmpConnectionManager.State.STREAMING -> {
                        _isRunning = true
                        listener?.onSourceStarted()
                    }
                    RtmpConnectionManager.State.DISCONNECTED,
                    RtmpConnectionManager.State.CONNECTION_ERROR -> {
                        _isRunning = false
                        listener?.onSourceStopped()
                    }
                    else -> {}
                }
            }

            override fun onReconnecting(attempt: Int, maxAttempts: Int) {
                // UI updates via connection manager listener
            }

            override fun onError(reason: RtmpConnectionManager.ErrorReason, detail: String) {
                listener?.onError("${reason.userMessage} ($detail)", isFatal = true)
            }
        })
    }

    override fun setOutputSurface(surface: Surface?) {
        this.outputSurface = surface
        player?.setSurface(surface)
    }

    override fun setListener(listener: VideoSourceListener?) {
        this.listener = listener
    }

    override fun start() {
        if (streamUrl.isBlank()) {
            listener?.onError("RTMP URL is empty. Please enter a valid RTMP stream URL.", false)
            return
        }

        connectionManager.connect(streamUrl) { validUrl ->
            initializePlayer(validUrl)
        }
    }

    private fun initializePlayer(url: String) {
        player?.release()
        player = RtmpPlayer(context).apply {
            setSurface(outputSurface)
            setListener(object : RtmpPlayer.Listener {
                override fun onPlaybackReady() {
                    connectionManager.markConnected()
                }

                override fun onPlaybackStarted() {
                    connectionManager.markStreaming()
                    _isRunning = true
                    listener?.onSourceStarted()
                }

                override fun onVideoSizeChanged(width: Int, height: Int, rotationDegrees: Int) {
                    _streamInfo = _streamInfo?.copy(width = width, height = height)
                        ?: StreamInfo(width = width, height = height)
                    listener?.onVideoSizeChanged(width, height, rotationDegrees)
                    _streamInfo?.let { listener?.onStreamInfoUpdated(it) }
                }

                override fun onFormatChanged(format: Format) {
                    val fps = if (format.frameRate > 0) format.frameRate else 30f
                    val bitrate = if (format.bitrate > 0) format.bitrate / 1000 else 2500
                    val codec = format.sampleMimeType ?: "video/avc (H.264)"

                    _streamInfo = StreamInfo(
                        width = format.width,
                        height = format.height,
                        fps = fps,
                        bitrateKbps = bitrate,
                        videoCodec = codec
                    )
                    listener?.onStreamInfoUpdated(_streamInfo!!)
                }

                override fun onError(error: PlaybackException) {
                    val reason = classifyError(error)
                    connectionManager.handleConnectionLoss(reason, error.message ?: "Unknown", ::initializePlayer)
                }
            })
            start(url)
        }
    }

    private fun classifyError(error: PlaybackException): RtmpConnectionManager.ErrorReason {
        val msg = error.message?.lowercase() ?: ""
        return when {
            msg.contains("timeout") -> RtmpConnectionManager.ErrorReason.NETWORK_TIMEOUT
            msg.contains("unknownhost") || msg.contains("dns") -> RtmpConnectionManager.ErrorReason.DNS_FAILURE
            msg.contains("auth") || msg.contains("401") || msg.contains("403") -> RtmpConnectionManager.ErrorReason.AUTHENTICATION_FAILURE
            msg.contains("codec") || msg.contains("mediacodec") -> RtmpConnectionManager.ErrorReason.UNSUPPORTED_CODEC
            else -> RtmpConnectionManager.ErrorReason.CONNECTION_LOST
        }
    }

    override fun stop() {
        _isRunning = false
        connectionManager.disconnect()
        player?.stop()
        player?.release()
        player = null
        listener?.onSourceStopped()
    }

    override fun switch() {
        // Switching on RTMP source can toggle between high/low bitrate profile or refresh stream
        if (_isRunning) {
            stop()
            start()
        }
    }
}
