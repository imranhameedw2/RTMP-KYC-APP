package com.example.rtmpvirtualcamera.ui

import android.Manifest
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.SurfaceHolder
import android.view.View
import android.widget.Chronometer
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.rtmpvirtualcamera.R
import com.example.rtmpvirtualcamera.camera.PhysicalCameraSource
import com.example.rtmpvirtualcamera.camera.RtmpVideoSource
import com.example.rtmpvirtualcamera.camera.VideoSource
import com.example.rtmpvirtualcamera.camera.VideoSourceListener
import com.example.rtmpvirtualcamera.databinding.ActivityMainBinding
import com.example.rtmpvirtualcamera.recording.VideoRecorder
import com.example.rtmpvirtualcamera.rtmp.RtmpConnectionManager
import com.example.rtmpvirtualcamera.rtmp.StreamInfo
import com.example.rtmpvirtualcamera.service.StreamingForegroundService
import com.example.rtmpvirtualcamera.storage.MediaStorageManager
import com.example.rtmpvirtualcamera.ui.components.CameraSourceType
import kotlinx.coroutines.launch

/**
 * Main Activity providing the unified camera preview, RTMP connection controls,
 * snapshot capture, MP4 recording, and camera switching.
 */
class MainActivity : AppCompatActivity(), SurfaceHolder.Callback {

    private lateinit var binding: ActivityMainBinding
    private lateinit var storageManager: MediaStorageManager
    private lateinit var videoRecorder: VideoRecorder

    private var currentSourceType: CameraSourceType = CameraSourceType.RTMP_STREAM
    private var activeSource: VideoSource? = null

    private var physicalCameraSource: PhysicalCameraSource? = null
    private var rtmpVideoSource: RtmpVideoSource? = null

    private var isRecording = false

    private val qrScanLauncher = registerForActivityResult(
        com.journeyapps.barcodescanner.ScanContract()
    ) { result ->
        if (result.contents != null) {
            val scanned = result.contents.trim()
            // Extract rtmp:// or rtmps:// if part of a longer string
            val regex = Regex("(rtmps?://\\S+)", RegexOption.IGNORE_CASE)
            val match = regex.find(scanned)
            val url = match?.value ?: scanned

            binding.editRtmpUrl.setText(url)
            showToast("Scanned: $url")
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false

        if (cameraGranted) {
            if (currentSourceType == CameraSourceType.PHYSICAL_CAMERA) {
                startPhysicalCamera()
            }
        } else {
            showToast("Camera permission denied. Physical camera unavailable.")
            switchCameraSource(CameraSourceType.RTMP_STREAM)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        storageManager = MediaStorageManager(this)
        videoRecorder = VideoRecorder(this, storageManager)

        setupSurfaceView()
        setupUIListeners()
        loadInitialState()
        checkInitialPermissions()
    }

    private fun setupSurfaceView() {
        binding.surfaceView.holder.addCallback(this)
        binding.surfaceView.holder.setFormat(PixelFormat.TRANSLUCENT)
    }

    private fun loadInitialState() {
        val savedUrl = SettingsActivity.getSavedRtmpUrl(this)
        binding.editRtmpUrl.setText(savedUrl)
        updateSourceSelectionUI(CameraSourceType.RTMP_STREAM)
    }

    private fun setupUIListeners() {
        // Source Selector Buttons
        binding.btnRealCamera.setOnClickListener {
            switchCameraSource(CameraSourceType.PHYSICAL_CAMERA)
        }
        binding.btnRtmpStream.setOnClickListener {
            switchCameraSource(CameraSourceType.RTMP_STREAM)
        }

        // Paste URL Button
        binding.btnPasteUrl.setOnClickListener {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val text = clip.getItemAt(0).text?.toString() ?: ""
                binding.editRtmpUrl.setText(text)
                showToast("Pasted from clipboard")
            }
        }

        // QR Code Scanner Button
        binding.btnScanQr.setOnClickListener {
            launchQrScanner()
        }

        // Connect & Live / Stop Stream Button
        binding.btnConnectLive.setOnClickListener {
            if (activeSource?.isRunning == true) {
                stopActiveStream()
            } else {
                startActiveStream()
            }
        }

        // Camera Switch / Flip (for real camera)
        binding.btnSwitchCamera.setOnClickListener {
            activeSource?.switch()
            showToast("Switched camera lens")
        }

        // Capture Photo Snapshot
        binding.btnCapturePhoto.setOnClickListener {
            capturePhotoSnapshot()
        }

        // Record MP4
        binding.btnRecord.setOnClickListener {
            toggleRecording()
        }

        // Settings Button
        binding.btnSettings.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }

        // Virtual Camera Limitation Info Button
        binding.btnInfoVirtualCamera.setOnClickListener {
            showVirtualCameraLimitationDialog()
        }
    }

    private fun switchCameraSource(newSource: CameraSourceType) {
        if (currentSourceType == newSource && activeSource != null) return

        stopActiveStream()
        currentSourceType = newSource
        updateSourceSelectionUI(newSource)

        when (newSource) {
            CameraSourceType.PHYSICAL_CAMERA -> {
                binding.layoutRtmpInput.visibility = View.GONE
                binding.btnSwitchCamera.visibility = View.VISIBLE
                if (hasCameraPermission()) {
                    startPhysicalCamera()
                } else {
                    requestCameraPermissions()
                }
            }
            CameraSourceType.RTMP_STREAM -> {
                binding.layoutRtmpInput.visibility = View.VISIBLE
                binding.btnSwitchCamera.visibility = View.GONE
                updateStatusBadge("Disconnected", R.color.status_gray)
            }
        }
    }

    private fun updateSourceSelectionUI(selected: CameraSourceType) {
        if (selected == CameraSourceType.PHYSICAL_CAMERA) {
            binding.btnRealCamera.setBackgroundColor(ContextCompat.getColor(this, R.color.md_theme_primary))
            binding.btnRealCamera.setTextColor(ContextCompat.getColor(this, R.color.md_theme_onPrimary))
            binding.btnRtmpStream.setBackgroundColor(ContextCompat.getColor(this, R.color.surface_variant))
            binding.btnRtmpStream.setTextColor(ContextCompat.getColor(this, R.color.on_surface_variant))
        } else {
            binding.btnRtmpStream.setBackgroundColor(ContextCompat.getColor(this, R.color.md_theme_primary))
            binding.btnRtmpStream.setTextColor(ContextCompat.getColor(this, R.color.md_theme_onPrimary))
            binding.btnRealCamera.setBackgroundColor(ContextCompat.getColor(this, R.color.surface_variant))
            binding.btnRealCamera.setTextColor(ContextCompat.getColor(this, R.color.on_surface_variant))
        }
    }

    private fun startActiveStream() {
        when (currentSourceType) {
            CameraSourceType.RTMP_STREAM -> {
                val url = binding.editRtmpUrl.text?.toString()?.trim() ?: ""
                if (url.isBlank()) {
                    showToast("Please enter an RTMP stream URL")
                    return
                }

                updateStatusBadge("Connecting...", R.color.status_orange)
                binding.btnConnectLive.text = getString(R.string.stop_stream)
                binding.btnConnectLive.setIconResource(android.R.drawable.ic_media_pause)

                rtmpVideoSource = RtmpVideoSource(this, url).apply {
                    setOutputSurface(binding.surfaceView.holder.surface)
                    setListener(createVideoSourceListener("RTMP Stream"))
                    start()
                }
                activeSource = rtmpVideoSource

                // Start Foreground Service if requested for background playback
                StreamingForegroundService.startStreamingService(this, url)
            }
            CameraSourceType.PHYSICAL_CAMERA -> {
                startPhysicalCamera()
            }
        }
    }

    private fun startPhysicalCamera() {
        if (!hasCameraPermission()) {
            requestCameraPermissions()
            return
        }

        binding.btnConnectLive.text = getString(R.string.stop_stream)
        updateStatusBadge("Camera Active", R.color.status_green)

        physicalCameraSource = PhysicalCameraSource(this, this).apply {
            setOutputSurface(binding.surfaceView.holder.surface)
            setListener(createVideoSourceListener("Physical Camera"))
            start()
        }
        activeSource = physicalCameraSource
    }

    private fun stopActiveStream() {
        if (isRecording) {
            toggleRecording()
        }
        activeSource?.stop()
        activeSource = null
        StreamingForegroundService.stopStreamingService(this)

        binding.btnConnectLive.text = getString(R.string.connect_live)
        binding.btnConnectLive.setIconResource(android.R.drawable.ic_media_play)
        updateStatusBadge("Disconnected", R.color.status_gray)
        binding.txtResolutionFps.text = "0x0 • 0 FPS"
    }

    private fun createVideoSourceListener(sourceName: String) = object : VideoSourceListener {
        override fun onSourceStarted() {
            runOnUiThread {
                updateStatusBadge("Streaming", R.color.status_green)
            }
        }

        override fun onSourceStopped() {
            runOnUiThread {
                updateStatusBadge("Disconnected", R.color.status_gray)
            }
        }

        override fun onVideoSizeChanged(width: Int, height: Int, unappliedRotationDegrees: Int) {
            runOnUiThread {
                binding.txtResolutionFps.text = "${width}x${height}"
            }
        }

        override fun onStreamInfoUpdated(info: StreamInfo) {
            runOnUiThread {
                binding.txtResolutionFps.text = "${info.width}x${info.height} • ${info.fps.toInt()} FPS • ${info.videoCodec}"
            }
        }

        override fun onError(errorMessage: String, isFatal: Boolean) {
            runOnUiThread {
                updateStatusBadge("Connection Error", R.color.status_red)
                showToast(errorMessage)
            }
        }
    }

    private fun capturePhotoSnapshot() {
        // Snapshot current surface frame or camera capture
        val bitmap = Bitmap.createBitmap(binding.surfaceView.width, binding.surfaceView.height, Bitmap.Config.ARGB_8888)
        android.view.PixelCopy.request(
            binding.surfaceView,
            bitmap,
            { copyResult ->
                if (copyResult == android.view.PixelCopy.SUCCESS) {
                    lifecycleScope.launch {
                        val uri = storageManager.savePhoto(bitmap)
                        if (uri != null) {
                            showToast("Photo Saved")
                        } else {
                            showToast("Failed to save photo")
                        }
                    }
                } else {
                    showToast("Failed to capture frame: $copyResult")
                }
            },
            android.os.Handler(android.os.Looper.getMainLooper())
        )
    }

    private fun toggleRecording() {
        if (!isRecording) {
            val surface = videoRecorder.startRecording(
                width = 1920,
                height = 1080,
                includeAudio = true
            )
            if (surface != null) {
                isRecording = true
                binding.btnRecord.setText(R.string.stop_recording)
                binding.txtRecordingTimer.visibility = View.VISIBLE
                binding.txtRecordingTimer.base = SystemClock.elapsedRealtime()
                binding.txtRecordingTimer.start()
                showToast("Recording Started")
            }
        } else {
            videoRecorder.stopRecording()
            isRecording = false
            binding.btnRecord.setText(R.string.record)
            binding.txtRecordingTimer.stop()
            binding.txtRecordingTimer.visibility = View.GONE
            showToast("Video Saved to Gallery")
        }
    }

    private fun updateStatusBadge(statusText: String, colorResId: Int) {
        binding.badgeStatus.text = "● $statusText"
        binding.badgeStatus.setTextColor(ContextCompat.getColor(this, colorResId))
    }

    private fun showVirtualCameraLimitationDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.about_virtual_camera_title)
            .setMessage(R.string.about_virtual_camera_message)
            .setPositiveButton(android.R.string.ok, null)
            .show()
    }

    private fun showToast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestCameraPermissions() {
        val permissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        permissionLauncher.launch(permissions.toTypedArray())
    }

    private fun checkInitialPermissions() {
        if (!hasCameraPermission()) {
            requestCameraPermissions()
        }
    }

    private fun launchQrScanner() {
        if (!hasCameraPermission()) {
            requestCameraPermissions()
            return
        }

        val options = com.journeyapps.barcodescanner.ScanOptions().apply {
            setPrompt("Scan RTMP URL QR Code from Monitor or Screen")
            setBeepEnabled(true)
            setBarcodeImageEnabled(false)
            setOrientationLocked(true)
            setDesiredBarcodeFormats(com.journeyapps.barcodescanner.ScanOptions.QR_CODE)
        }
        qrScanLauncher.launch(options)
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        activeSource?.setOutputSurface(holder.surface)
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        activeSource?.setOutputSurface(holder.surface)
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        activeSource?.setOutputSurface(null)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopActiveStream()
        physicalCameraSource?.release()
    }
}
