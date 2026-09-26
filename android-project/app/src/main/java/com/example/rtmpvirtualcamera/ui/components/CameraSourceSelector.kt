package com.example.rtmpvirtualcamera.ui.components

enum class CameraSourceType {
    PHYSICAL_CAMERA,
    RTMP_STREAM
}

interface OnCameraSourceChangedListener {
    fun onSourceChanged(newSource: CameraSourceType)
}
