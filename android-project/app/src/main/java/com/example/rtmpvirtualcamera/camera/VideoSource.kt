package com.example.rtmpvirtualcamera.camera

import android.view.Surface
import com.example.rtmpvirtualcamera.rtmp.StreamInfo

/**
 * Common Video Source interface for RTMP Virtual Camera.
 * Abstraction layer that unifies physical device cameras and RTMP live streams
 * into a single interchangeable video pipeline for the application.
 */
interface VideoSource {
    /**
     * Start producing video frames to the configured surface.
     */
    fun start()

    /**
     * Stop streaming and release active hardware/network resources.
     */
    fun stop()

    /**
     * Toggle or switch camera direction (front/back) or sub-stream if supported.
     */
    fun switch()

    /**
     * Set the target Surface (e.g. from SurfaceView or TextureView) for frame rendering.
     */
    fun setOutputSurface(surface: Surface?)

    /**
     * Current playback or capture state.
     */
    val isRunning: Boolean

    /**
     * Current video stream metadata (resolution, frame rate, etc.).
     */
    val currentStreamInfo: StreamInfo?

    /**
     * Register a listener for lifecycle, dimension, and error events.
     */
    fun setListener(listener: VideoSourceListener?)
}

/**
 * Callbacks from the active VideoSource back to the UI/recorder pipeline.
 */
interface VideoSourceListener {
    fun onSourceStarted()
    fun onSourceStopped()
    fun onVideoSizeChanged(width: Int, height: Int, unappliedRotationDegrees: Int)
    fun onStreamInfoUpdated(info: StreamInfo)
    fun onError(errorMessage: String, isFatal: Boolean)
}
