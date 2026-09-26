package com.example.rtmpvirtualcamera.rtmp

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

    /**
     * Validates whether a provided string is a syntactically valid RTMP or RTMPS URL.
     */
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

    /**
     * Initiates connection to the given RTMP URL.
     */
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
}
