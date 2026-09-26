package com.example.rtmpvirtualcamera

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
        assertFalse(manager.validateUrl("not_a_valid_url"))
    }

    @Test
    fun testConnectionLifecycle() {
        var stateChangedCount = 0
        manager.setStateListener(object : RtmpConnectionManager.StateListener {
            override fun onStateChanged(state: RtmpConnectionManager.State) {
                stateChangedCount++
            }
            override fun onReconnecting(attempt: Int, maxAttempts: Int) {}
            override fun onError(reason: RtmpConnectionManager.ErrorReason, detail: String) {}
        })

        manager.connect("rtmp://example.com/live/test") {}
        assertEquals(RtmpConnectionManager.State.CONNECTING, manager.currentState)

        manager.markConnected()
        assertEquals(RtmpConnectionManager.State.CONNECTED, manager.currentState)

        manager.markStreaming()
        assertEquals(RtmpConnectionManager.State.STREAMING, manager.currentState)

        manager.disconnect()
        assertEquals(RtmpConnectionManager.State.DISCONNECTED, manager.currentState)
    }

    @Test
    fun testAutoReconnectWithBackoff() = testScope.runTest {
        var reconnectAttempts = 0
        manager.setStateListener(object : RtmpConnectionManager.StateListener {
            override fun onStateChanged(state: RtmpConnectionManager.State) {}
            override fun onReconnecting(attempt: Int, maxAttempts: Int) {
                reconnectAttempts = attempt
            }
            override fun onError(reason: RtmpConnectionManager.ErrorReason, detail: String) {}
        })

        manager.connect("rtmp://example.com/live/test") {}
        manager.handleConnectionLoss(RtmpConnectionManager.ErrorReason.CONNECTION_LOST, "Socket closed") {}

        assertEquals(1, reconnectAttempts)
        assertEquals(RtmpConnectionManager.State.RECONNECTING, manager.currentState)

        advanceTimeBy(1001L)
        assertEquals(RtmpConnectionManager.State.CONNECTING, manager.currentState)
    }

    @Test
    fun testCancelReconnectionStopsTimer() {
        manager.connect("rtmp://example.com/live/test") {}
        manager.handleConnectionLoss(RtmpConnectionManager.ErrorReason.CONNECTION_LOST, "Server reset") {}

        manager.cancelReconnection()
        manager.disconnect()
        assertEquals(RtmpConnectionManager.State.DISCONNECTED, manager.currentState)
    }
}
