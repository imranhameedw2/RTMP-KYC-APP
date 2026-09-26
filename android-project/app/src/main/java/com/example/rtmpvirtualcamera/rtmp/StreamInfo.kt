package com.example.rtmpvirtualcamera.rtmp

/**
 * Immutable value object holding live video stream metrics and codec information.
 */
data class StreamInfo(
    val width: Int = 0,
    val height: Int = 0,
    val fps: Float = 0f,
    val bitrateKbps: Int = 0,
    val videoCodec: String = "H.264/AVC",
    val audioCodec: String = "AAC",
    val isLive: Boolean = true
) {
    val resolutionLabel: String
        get() = if (width > 0 && height > 0) "${width}x${height}" else "Unknown"

    val aspectRatioLabel: String
        get() {
            if (width <= 0 || height <= 0) return "Unknown"
            val gcd = calculateGcd(width, height)
            val w = width / gcd
            val h = height / gcd
            return if (width > height) {
                if (w == 16 && h == 9) "16:9 Landscape"
                else if (w == 4 && h == 3) "4:3 Landscape"
                else "${w}:${h} Landscape"
            } else if (height > width) {
                if (w == 9 && h == 16) "9:16 Portrait"
                else if (w == 3 && h == 4) "3:4 Portrait"
                else "${w}:${h} Portrait"
            } else {
                "1:1 Square"
            }
        }

    val isPortrait: Boolean
        get() = height > width

    private fun calculateGcd(a: Int, b: Int): Int {
        var x = a
        var y = b
        while (y != 0) {
            val t = y
            y = x % y
            x = t
        }
        return if (x == 0) 1 else x
    }
}
