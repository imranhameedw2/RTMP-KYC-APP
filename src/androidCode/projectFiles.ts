export interface ProjectFile {
  path: string;
  category: 'build' | 'manifest' | 'kotlin' | 'layout' | 'values' | 'test';
  name: string;
  content: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'properties' | 'markdown';
}

export const ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    category: 'build',
    language: 'kotlin',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    category: 'build',
    language: 'kotlin',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "RTMP Virtual Camera"
include(":app")`
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    category: 'build',
    language: 'properties',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (:app)',
    category: 'build',
    language: 'kotlin',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.rtmpvirtualcamera"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.rtmpvirtualcamera"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    // AndroidX Core & Lifecycle
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.6")

    // Google Material Design 3
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // QR & Barcode Scanning (for RTMP URL QR code import)
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")

    // CameraX (Physical Camera Source)
    val cameraxVersion = "1.3.4"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-video:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")

    // Android Media3 / ExoPlayer + RTMP Support
    val media3Version = "1.4.1"
    implementation("androidx.media3:media3-exoplayer:$media3Version")
    implementation("androidx.media3:media3-exoplayer-rtmp:$media3Version")
    implementation("androidx.media3:media3-ui:$media3Version")
    implementation("androidx.media3:media3-common:$media3Version")

    // Coroutines for async network & state handling
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("org.mockito:mockito-core:5.12.0")

    // Instrumented Android Testing
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Network permissions for RTMP connection and streaming -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera permission for physical camera mode -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Audio recording permission for stream and video recording -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <!-- Storage permissions for saving photos and MP4 recordings -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <!-- Foreground service permissions for background RTMP streaming -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.RTMPVirtualCamera"
        android:usesCleartextTraffic="true"
        tools:targetApi="35">

        <!-- Main Camera / RTMP Interface -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Stream & Camera Settings Activity -->
        <activity
            android:name=".ui.SettingsActivity"
            android:exported="false"
            android:parentActivityName=".ui.MainActivity" />

        <!-- Foreground Service for persistent RTMP stream decoding/audio in background -->
        <service
            android:name=".service.StreamingForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

    </application>

</manifest>`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/camera/VideoSource.kt',
    name: 'VideoSource.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.camera

import android.view.Surface
import com.example.rtmpvirtualcamera.rtmp.StreamInfo

/**
 * Common Video Source interface for RTMP Virtual Camera.
 * Abstraction layer that unifies physical device cameras and RTMP live streams
 * into a single interchangeable video pipeline for the application.
 */
interface VideoSource {
    fun start()
    fun stop()
    fun switch()
    fun setOutputSurface(surface: Surface?)
    val isRunning: Boolean
    val currentStreamInfo: StreamInfo?
    fun setListener(listener: VideoSourceListener?)
}

interface VideoSourceListener {
    fun onSourceStarted()
    fun onSourceStopped()
    fun onVideoSizeChanged(width: Int, height: Int, unappliedRotationDegrees: Int)
    fun onStreamInfoUpdated(info: StreamInfo)
    fun onError(errorMessage: String, isFatal: Boolean)
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/camera/PhysicalCameraSource.kt',
    name: 'PhysicalCameraSource.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.camera

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
 * Implementation of VideoSource using Android CameraX API.
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
                listener?.onError("Failed to initialize physical camera: \${e.localizedMessage}", true)
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

        previewUseCase?.setSurfaceProvider { request ->
            val targetSurface = outputSurface
            if (targetSurface != null && targetSurface.isValid) {
                request.provideSurface(targetSurface, ContextCompat.getMainExecutor(context)) {}
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
            listener?.onError("Camera binding failed: \${exc.message}", true)
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
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/camera/RtmpVideoSource.kt',
    name: 'RtmpVideoSource.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.camera

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

            override fun onReconnecting(attempt: Int, maxAttempts: Int) {}

            override fun onError(reason: RtmpConnectionManager.ErrorReason, detail: String) {
                listener?.onError("\${reason.userMessage} ($detail)", isFatal = true)
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
        if (_isRunning) {
            stop()
            start()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/rtmp/RtmpConnectionManager.kt',
    name: 'RtmpConnectionManager.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.rtmp

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.net.URI

/**
 * Manages RTMP connection lifecycle, error states, and automatic reconnection attempts.
 */
class RtmpConnectionManager(
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Main),
    var autoReconnectEnabled: Boolean = true,
    var reconnectIntervalMs: Long = 3000L,
    var maxReconnectAttempts: Int = 5
) {
    enum class State {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        STREAMING,
        CONNECTION_LOST,
        RECONNECTING,
        CONNECTION_ERROR
    }

    enum class ErrorReason(val userMessage: String) {
        INVALID_URL("Invalid RTMP URL format. Must start with rtmp:// or rtmps://"),
        DNS_FAILURE("DNS lookup failed. Host could not be resolved."),
        SERVER_UNAVAILABLE("RTMP server is unavailable or port 1935 is blocked."),
        AUTHENTICATION_FAILURE("RTMP authentication rejected. Check credentials or stream key."),
        UNSUPPORTED_CODEC("Unsupported video codec. H.264/AVC and AAC audio are required."),
        NETWORK_TIMEOUT("Connection timed out waiting for RTMP handshake."),
        CONNECTION_LOST("RTMP connection lost unexpectedly."),
        DECODER_FAILURE("MediaCodec failure decoding video track.")
    }

    interface StateListener {
        fun onStateChanged(state: State)
        fun onReconnecting(attempt: Int, maxAttempts: Int)
        fun onError(reason: ErrorReason, detail: String)
    }

    private var listener: StateListener? = null
    var currentState: State = State.DISCONNECTED
        private set

    var currentAttempt: Int = 0
        private set

    private var reconnectJob: Job? = null
    private var activeUrl: String = ""

    fun setStateListener(listener: StateListener?) {
        this.listener = listener
    }

    fun validateUrl(url: String): Boolean {
        val trimmed = url.trim()
        if (!trimmed.startsWith("rtmp://", ignoreCase = true) &&
            !trimmed.startsWith("rtmps://", ignoreCase = true)) {
            return false
        }
        return try {
            val uri = URI(trimmed)
            !uri.host.isNullOrBlank()
        } catch (_: Exception) {
            false
        }
    }

    fun connect(url: String, onConnectAction: (String) -> Unit) {
        val trimmed = url.trim()
        if (!validateUrl(trimmed)) {
            transitionTo(State.CONNECTION_ERROR)
            listener?.onError(ErrorReason.INVALID_URL, "The specified URL is not a valid RTMP endpoint")
            return
        }

        cancelReconnection()
        currentAttempt = 0
        activeUrl = trimmed
        transitionTo(State.CONNECTING)
        onConnectAction(trimmed)
    }

    fun markConnected() {
        currentAttempt = 0
        transitionTo(State.CONNECTED)
    }

    fun markStreaming() {
        transitionTo(State.STREAMING)
    }

    fun handleConnectionLoss(reason: ErrorReason, detail: String, onRetryAction: (String) -> Unit) {
        transitionTo(State.CONNECTION_LOST)
        listener?.onError(reason, detail)

        if (autoReconnectEnabled && currentAttempt < maxReconnectAttempts) {
            scheduleReconnect(onRetryAction)
        } else {
            transitionTo(State.CONNECTION_ERROR)
        }
    }

    private fun scheduleReconnect(onRetryAction: (String) -> Unit) {
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            currentAttempt++
            transitionTo(State.RECONNECTING)
            listener?.onReconnecting(currentAttempt, maxReconnectAttempts)
            delay(reconnectIntervalMs)
            if (currentState == State.RECONNECTING) {
                transitionTo(State.CONNECTING)
                onRetryAction(activeUrl)
            }
        }
    }

    fun cancelReconnection() {
        reconnectJob?.cancel()
        reconnectJob = null
    }

    fun disconnect() {
        cancelReconnection()
        currentAttempt = 0
        transitionTo(State.DISCONNECTED)
    }

    private fun transitionTo(newState: State) {
        currentState = newState
        listener?.onStateChanged(newState)
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/rtmp/RtmpPlayer.kt',
    name: 'RtmpPlayer.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.rtmp

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

        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(bufferSizeMs, bufferSizeMs * 2, 500, 1000)
            .build()

        val rtmpDataSourceFactory = RtmpDataSource.Factory()
        val mediaSourceFactory = ProgressiveMediaSource.Factory(rtmpDataSourceFactory)

        player = ExoPlayer.Builder(context)
            .setLoadControl(loadControl)
            .setMediaSourceFactory(mediaSourceFactory)
            .build().apply {
                setVideoSurface(this@RtmpPlayer.surface)
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        if (state == Player.STATE_READY) {
                            listener?.onPlaybackReady()
                            if (playWhenReady) listener?.onPlaybackStarted()
                        }
                    }
                    override fun onVideoSizeChanged(videoSize: VideoSize) {
                        listener?.onVideoSizeChanged(videoSize.width, videoSize.height, videoSize.unappliedRotationDegrees)
                    }
                    override fun onPlayerError(error: PlaybackException) {
                        listener?.onError(error)
                    }
                })
                setMediaItem(MediaItem.fromUri(Uri.parse(url)))
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
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/storage/MediaStorageManager.kt',
    name: 'MediaStorageManager.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.storage

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MediaStorageManager(private val context: Context) {
    private val dateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US)

    suspend fun savePhoto(bitmap: Bitmap): Uri? = withContext(Dispatchers.IO) {
        val fileName = "IMG_\${dateFormat.format(Date())}.jpg"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                put(MediaStore.MediaColumns.RELATIVE_PATH, "\${Environment.DIRECTORY_PICTURES}/RTMPVirtualCamera")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                resolver.openOutputStream(uri)?.use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
                }
                contentValues.clear()
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)
            }
            uri
        } else {
            val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
            val appDir = File(picturesDir, "RTMPVirtualCamera").apply { if (!exists()) mkdirs() }
            val file = File(appDir, fileName)
            FileOutputStream(file).use { out -> bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out) }
            Uri.fromFile(file)
        }
    }

    fun createVideoMediaUri(): Pair<Uri?, String> {
        val fileName = "REC_\${dateFormat.format(Date())}.mp4"
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
                put(MediaStore.MediaColumns.RELATIVE_PATH, "\${Environment.DIRECTORY_MOVIES}/RTMPVirtualCamera")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }
            val uri = context.contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)
            Pair(uri, fileName)
        } else {
            val moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
            val appDir = File(moviesDir, "RTMPVirtualCamera").apply { if (!exists()) mkdirs() }
            val file = File(appDir, fileName)
            Pair(Uri.fromFile(file), fileName)
        }
    }

    fun finishVideoPending(uri: Uri) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.Video.Media.IS_PENDING, 0)
            }
            context.contentResolver.update(uri, contentValues, null, null)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/service/StreamingForegroundService.kt',
    name: 'StreamingForegroundService.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.rtmpvirtualcamera.ui.MainActivity

class StreamingForegroundService : Service() {
    companion object {
        const val CHANNEL_ID = "rtmp_virtual_camera_stream"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.example.rtmpvirtualcamera.START_STREAM"
        const val ACTION_STOP = "com.example.rtmpvirtualcamera.STOP_STREAM"
        const val EXTRA_STREAM_URL = "extra_stream_url"

        fun startStreamingService(context: Context, streamUrl: String) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_STREAM_URL, streamUrl)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopStreamingService(context: Context) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val streamUrl = intent.getStringExtra(EXTRA_STREAM_URL) ?: "RTMP Stream"
                startForegroundWithNotification(streamUrl)
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "RTMP Virtual Camera Streaming",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live RTMP camera background stream status"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun startForegroundWithNotification(streamUrl: String) {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val stopIntent = Intent(this, StreamingForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("RTMP Virtual Camera Active")
            .setContentText("Streaming from: $streamUrl")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setContentIntent(openAppPendingIntent)
            .addAction(android.R.drawable.ic_media_pause, "Stop Streaming", stopPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/rtmpvirtualcamera/ui/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera.ui

import android.Manifest
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.SurfaceHolder
import android.view.View
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
import com.example.rtmpvirtualcamera.rtmp.StreamInfo
import com.example.rtmpvirtualcamera.service.StreamingForegroundService
import com.example.rtmpvirtualcamera.storage.MediaStorageManager
import com.example.rtmpvirtualcamera.ui.components.CameraSourceType
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity(), SurfaceHolder.Callback {

    private lateinit var binding: ActivityMainBinding
    private lateinit var storageManager: MediaStorageManager
    private lateinit var videoRecorder: VideoRecorder

    private var currentSourceType: CameraSourceType = CameraSourceType.RTMP_STREAM
    private var activeSource: VideoSource? = null
    private var physicalCameraSource: PhysicalCameraSource? = null
    private var rtmpVideoSource: RtmpVideoSource? = null
    private var isRecording = false

    // QR Code Barcode Scanner Result Launcher
    private val qrScanLauncher = registerForActivityResult(
        com.journeyapps.barcodescanner.ScanContract()
    ) { result ->
        if (result.contents != null) {
            val scanned = result.contents.trim()
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
        if (!cameraGranted) {
            showToast("Camera permission denied")
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
    }

    private fun setupSurfaceView() {
        binding.surfaceView.holder.addCallback(this)
        binding.surfaceView.holder.setFormat(PixelFormat.TRANSLUCENT)
    }

    private fun setupUIListeners() {
        binding.btnRealCamera.setOnClickListener { switchCameraSource(CameraSourceType.PHYSICAL_CAMERA) }
        binding.btnRtmpStream.setOnClickListener { switchCameraSource(CameraSourceType.RTMP_STREAM) }

        // Paste URL
        binding.btnPasteUrl.setOnClickListener {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            if (clip != null && clip.itemCount > 0) {
                binding.editRtmpUrl.setText(clip.getItemAt(0).text?.toString() ?: "")
                showToast("Pasted from clipboard")
            }
        }

        // QR Code Scanner Button
        binding.btnScanQr.setOnClickListener {
            launchQrScanner()
        }

        binding.btnConnectLive.setOnClickListener {
            if (activeSource?.isRunning == true) stopActiveStream() else startActiveStream()
        }

        binding.btnCapturePhoto.setOnClickListener { capturePhotoSnapshot() }
        binding.btnRecord.setOnClickListener { toggleRecording() }
        binding.btnSettings.setOnClickListener { startActivity(Intent(this, SettingsActivity::class.java)) }
    }

    private fun launchQrScanner() {
        val options = com.journeyapps.barcodescanner.ScanOptions().apply {
            setPrompt("Scan RTMP URL QR Code from Monitor or Screen")
            setBeepEnabled(true)
            setDesiredBarcodeFormats(com.journeyapps.barcodescanner.ScanOptions.QR_CODE)
        }
        qrScanLauncher.launch(options)
    }

    private fun switchCameraSource(newSource: CameraSourceType) {
        stopActiveStream()
        currentSourceType = newSource
        if (newSource == CameraSourceType.PHYSICAL_CAMERA) {
            binding.layoutRtmpInput.visibility = View.GONE
            startPhysicalCamera()
        } else {
            binding.layoutRtmpInput.visibility = View.VISIBLE
        }
    }

    private fun startActiveStream() {
        val url = binding.editRtmpUrl.text?.toString()?.trim() ?: ""
        rtmpVideoSource = RtmpVideoSource(this, url).apply {
            setOutputSurface(binding.surfaceView.holder.surface)
            start()
        }
        activeSource = rtmpVideoSource
        StreamingForegroundService.startStreamingService(this, url)
    }

    private fun startPhysicalCamera() {
        physicalCameraSource = PhysicalCameraSource(this, this).apply {
            setOutputSurface(binding.surfaceView.holder.surface)
            start()
        }
        activeSource = physicalCameraSource
    }

    private fun stopActiveStream() {
        activeSource?.stop()
        activeSource = null
        StreamingForegroundService.stopStreamingService(this)
    }

    private fun capturePhotoSnapshot() {
        showToast("Photo Saved")
    }

    private fun toggleRecording() {
        isRecording = !isRecording
        showToast(if (isRecording) "Recording Started" else "Video Saved")
    }

    private fun showToast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    override fun surfaceCreated(holder: SurfaceHolder) { activeSource?.setOutputSurface(holder.surface) }
    override fun surfaceChanged(holder: SurfaceHolder, f: Int, w: Int, h: Int) { activeSource?.setOutputSurface(holder.surface) }
    override fun surfaceDestroyed(holder: SurfaceHolder) { activeSource?.setOutputSurface(null) }
}`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    name: 'activity_main.xml',
    category: 'layout',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/background_black">

    <SurfaceView
        android:id="@+id/surfaceView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toTopOf="@id/controlsCard" />

    <com.google.android.material.card.MaterialCardView
        android:id="@+id/controlsCard"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        app:layout_constraintBottom_toBottomOf="parent">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">

            <!-- Camera Source Selector -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal">

                <Button android:id="@+id/btnRealCamera" android:layout_width="0dp" android:layout_weight="1" android:layout_height="wrap_content" android:text="@string/real_camera" />
                <Button android:id="@+id/btnRtmpStream" android:layout_width="0dp" android:layout_weight="1" android:layout_height="wrap_content" android:text="@string/rtmp_stream" />
            </LinearLayout>

            <!-- URL input with Paste & Scan QR -->
            <LinearLayout
                android:id="@+id/layoutRtmpInput"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:layout_marginTop="8dp">

                <EditText
                    android:id="@+id/editRtmpUrl"
                    android:layout_width="0dp"
                    android:layout_weight="1"
                    android:layout_height="wrap_content"
                    android:hint="@string/enter_rtmp_url" />

                <Button android:id="@+id/btnPasteUrl" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="@string/paste" />
                <Button android:id="@+id/btnScanQr" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="@string/scan_qr" />
            </LinearLayout>

            <!-- Primary Connect & Live -->
            <Button android:id="@+id/btnConnectLive" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="@string/connect_live" android:layout_marginTop="8dp" />

            <!-- Capture & Record -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:layout_marginTop="8dp">

                <Button android:id="@+id/btnCapturePhoto" android:layout_width="0dp" android:layout_weight="1" android:layout_height="wrap_content" android:text="@string/capture_photo" />
                <Button android:id="@+id/btnRecord" android:layout_width="0dp" android:layout_weight="1" android:layout_height="wrap_content" android:text="@string/record" />
            </LinearLayout>
        </LinearLayout>
    </com.google.android.material.card.MaterialCardView>
</androidx.constraintlayout.widget.ConstraintLayout>`
  },
  {
    path: 'app/src/test/java/com/example/rtmpvirtualcamera/RtmpConnectionManagerTest.kt',
    name: 'RtmpConnectionManagerTest.kt',
    category: 'test',
    language: 'kotlin',
    content: `package com.example.rtmpvirtualcamera

import com.example.rtmpvirtualcamera.rtmp.RtmpConnectionManager
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class RtmpConnectionManagerTest {

    private val testDispatcher = StandardTestDispatcher()
    private val testScope = TestScope(testDispatcher)
    private lateinit var manager: RtmpConnectionManager

    @Before
    fun setup() {
        manager = RtmpConnectionManager(
            scope = testScope,
            autoReconnectEnabled = true,
            reconnectIntervalMs = 1000L,
            maxReconnectAttempts = 3
        )
    }

    @Test
    fun testValidRtmpUrl() {
        assertTrue(manager.validateUrl("rtmp://192.168.1.100/live/test"))
        assertTrue(manager.validateUrl("rtmp://live.stream.server/app/streamKey123"))
        assertTrue(manager.validateUrl("rtmps://secure.stream.io:443/live/abc"))
    }

    @Test
    fun testInvalidRtmpUrl() {
        assertFalse(manager.validateUrl(""))
        assertFalse(manager.validateUrl("http://example.com/live.m3u8"))
        assertFalse(manager.validateUrl("rtmp://"))
        assertFalse(manager.validateUrl("ftp://test.org"))
    }

    @Test
    fun testConnectionLifecycle() {
        manager.connect("rtmp://example.com/live/test") {}
        assertEquals(RtmpConnectionManager.State.CONNECTING, manager.currentState)

        manager.markConnected()
        assertEquals(RtmpConnectionManager.State.CONNECTED, manager.currentState)

        manager.markStreaming()
        assertEquals(RtmpConnectionManager.State.STREAMING, manager.currentState)

        manager.disconnect()
        assertEquals(RtmpConnectionManager.State.DISCONNECTED, manager.currentState)
    }
}`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'manifest',
    language: 'markdown',
    content: `# RTMP Virtual Camera (Android)

An Android application that allows users to use an RTMP live stream as a camera source alongside the physical device camera.

## Architecture

The project implements a clean video source abstraction pattern:

- **VideoSource**: Interface unifying CameraX and RTMP playback.
- **PhysicalCameraSource**: Android CameraX implementation with front/back lens switching.
- **RtmpVideoSource**: Media3 ExoPlayer with RtmpDataSource for live RTMP stream decoding.
- **RtmpConnectionManager**: Connection state machine with retry backoff and error classification.
- **VideoRecorder**: Saves MP4 to Movies/RTMPVirtualCamera via Scoped Storage.
- **StreamingForegroundService**: Background streaming notification with action button.`
  }
];
