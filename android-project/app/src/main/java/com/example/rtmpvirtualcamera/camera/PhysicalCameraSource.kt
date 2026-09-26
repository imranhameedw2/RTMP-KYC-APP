package com.example.rtmpvirtualcamera.camera

import android.content.Context
import android.util.Size
import android.view.Surface
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.example.rtmpvirtualcamera.rtmp.StreamInfo
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Implementation of VideoSource using the official Android CameraX API.
 * Manages physical device camera hardware lifecycle, preview surface binding,
 * and front/back lens selection.
 */
class PhysicalCameraSource(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner
) : VideoSource {

    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null
    private var previewUseCase: Preview? = null
    var imageCaptureUseCase: ImageCapture? = null
        private set

    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var lensFacing: Int = CameraSelector.LENS_FACING_BACK
    private var outputSurface: Surface? = null
    private var listener: VideoSourceListener? = null

    private var _isRunning: Boolean = false
    override val isRunning: Boolean get() = _isRunning

    private var _streamInfo: StreamInfo? = null
    override val currentStreamInfo: StreamInfo? get() = _streamInfo

    override fun setOutputSurface(surface: Surface?) {
        this.outputSurface = surface
        // If already running, rebinding with new surface may be required
    }

    override fun setListener(listener: VideoSourceListener?) {
        this.listener = listener
    }

    override fun start() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                bindCameraUseCases()
                _isRunning = true
                listener?.onSourceStarted()
            } catch (e: Exception) {
                _isRunning = false
                listener?.onError("Failed to initialize physical camera: ${e.localizedMessage}", true)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    private fun bindCameraUseCases() {
        val provider = cameraProvider ?: return
        provider.unbindAll()

        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

        previewUseCase = Preview.Builder()
            .setTargetResolution(Size(1920, 1080))
            .build()

        // Bind the surface provider when surface is provided
        previewUseCase?.setSurfaceProvider { request ->
            val targetSurface = outputSurface
            if (targetSurface != null && targetSurface.isValid) {
                request.provideSurface(targetSurface, ContextCompat.getMainExecutor(context)) {
                    // Surface result callback
                }
            } else {
                request.willNotProvideSurface()
            }
        }

        imageCaptureUseCase = ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .build()

        try {
            camera = provider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                previewUseCase,
                imageCaptureUseCase
            )

            val lensName = if (lensFacing == CameraSelector.LENS_FACING_BACK) "Back Camera" else "Front Camera"
            _streamInfo = StreamInfo(
                width = 1920,
                height = 1080,
                fps = 30f,
                bitrateKbps = 12000,
                videoCodec = "Camera2/RAW ($lensName)"
            )
            listener?.onVideoSizeChanged(1920, 1080, 0)
            listener?.onStreamInfoUpdated(_streamInfo!!)
        } catch (exc: Exception) {
            listener?.onError("Camera binding failed: ${exc.message}", true)
        }
    }

    override fun switch() {
        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        if (_isRunning) {
            bindCameraUseCases()
        }
    }

    override fun stop() {
        _isRunning = false
        cameraProvider?.unbindAll()
        camera = null
        listener?.onSourceStopped()
    }

    fun release() {
        stop()
        cameraExecutor.shutdown()
    }
}
