package com.example.rtmpvirtualcamera.rtmp

import android.content.Context
import android.net.Uri
import android.view.Surface
import androidx.media3.common.Format
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.datasource.rtmp.RtmpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ProgressiveMediaSource

/**
 * ExoPlayer-backed RTMP video player.
 * Uses official Android Media3 RTMP datasource extension for standard-compliant H.264 & AAC RTMP playback.
 */
class RtmpPlayer(
    private val context: Context,
    private val bufferSizeMs: Int = 2000
) {
    interface Listener {
        fun onPlaybackReady()
        fun onPlaybackStarted()
        fun onVideoSizeChanged(width: Int, height: Int, rotationDegrees: Int)
        fun onFormatChanged(format: Format)
        fun onError(error: PlaybackException)
    }

    private var player: ExoPlayer? = null
    private var surface: Surface? = null
    private var listener: Listener? = null

    fun setListener(listener: Listener?) {
        this.listener = listener
    }

    fun setSurface(surface: Surface?) {
        this.surface = surface
        player?.setVideoSurface(surface)
    }

    fun start(url: String) {
        release()

        // Low latency buffer configuration for live RTMP streaming
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                bufferSizeMs,
                bufferSizeMs * 2,
                500,
                1000
            )
            .build()

        val rtmpDataSourceFactory = RtmpDataSource.Factory()
        val mediaSourceFactory = ProgressiveMediaSource.Factory(rtmpDataSourceFactory)

        player = ExoPlayer.Builder(context)
            .setLoadControl(loadControl)
            .setMediaSourceFactory(mediaSourceFactory)
            .build().apply {
                videoScalingMode = androidx.media3.common.C.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING
                setVideoSurface(this@RtmpPlayer.surface)

                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        when (playbackState) {
                            Player.STATE_READY -> {
                                listener?.onPlaybackReady()
                                if (playWhenReady) {
                                    listener?.onPlaybackStarted()
                                }
                            }
                            Player.STATE_ENDED -> {
                                // Live streams rarely end cleanly; typically signifies disconnect
                            }
                            Player.STATE_BUFFERING -> {}
                            Player.STATE_IDLE -> {}
                        }
                    }

                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        if (isPlaying) {
                            listener?.onPlaybackStarted()
                        }
                    }

                    override fun onVideoSizeChanged(videoSize: VideoSize) {
                        listener?.onVideoSizeChanged(
                            videoSize.width,
                            videoSize.height,
                            videoSize.unappliedRotationDegrees
                        )
                    }

                    override fun onPlayerError(error: PlaybackException) {
                        listener?.onError(error)
                    }
                })

                val mediaItem = MediaItem.fromUri(Uri.parse(url))
                setMediaItem(mediaItem)
                prepare()
                playWhenReady = true
            }
    }

    fun stop() {
        player?.stop()
    }

    fun release() {
        player?.release()
        player = null
    }

    val isPlaying: Boolean
        get() = player?.isPlaying == true
}
