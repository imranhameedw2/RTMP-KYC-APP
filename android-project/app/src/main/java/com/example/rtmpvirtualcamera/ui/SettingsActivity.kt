package com.example.rtmpvirtualcamera.ui

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.rtmpvirtualcamera.databinding.ActivitySettingsBinding

/**
 * SettingsActivity managing RTMP connection preferences, video scaling modes,
 * recording formats, and camera hardware choices.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var prefs: SharedPreferences

    companion object {
        const val PREFS_NAME = "rtmp_virtual_camera_prefs"
        const val KEY_RTMP_URL = "key_rtmp_url"
        const val KEY_AUTO_RECONNECT = "key_auto_reconnect"
        const val KEY_RECONNECT_INTERVAL = "key_reconnect_interval"
        const val KEY_BUFFER_SIZE = "key_buffer_size"
        const val KEY_SCALING_MODE = "key_scaling_mode"
        const val KEY_DEFAULT_CAMERA = "key_default_camera"
        const val KEY_RECORD_QUALITY = "key_record_quality"

        const val SCALING_FIT = "Fit"
        const val SCALING_CROP = "Crop"
        const val SCALING_ORIGINAL = "Original"

        fun getSavedRtmpUrl(context: Context): String {
            val p = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return p.getString(KEY_RTMP_URL, "rtmp://192.168.1.100/live/test") ?: "rtmp://192.168.1.100/live/test"
        }

        fun isAutoReconnectEnabled(context: Context): Boolean {
            val p = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return p.getBoolean(KEY_AUTO_RECONNECT, true)
        }

        fun getScalingMode(context: Context): String {
            val p = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return p.getString(KEY_SCALING_MODE, SCALING_FIT) ?: SCALING_FIT
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        setupToolbar()
        loadCurrentSettings()
        setupListeners()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.topAppBar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.topAppBar.setNavigationOnClickListener {
            saveSettings()
            finish()
        }
    }

    private fun loadCurrentSettings() {
        binding.editRtmpUrl.setText(prefs.getString(KEY_RTMP_URL, "rtmp://192.168.1.100/live/test"))
        binding.switchAutoReconnect.isChecked = prefs.getBoolean(KEY_AUTO_RECONNECT, true)
        binding.editReconnectInterval.setText(prefs.getInt(KEY_RECONNECT_INTERVAL, 3000).toString())
        binding.editBufferSize.setText(prefs.getInt(KEY_BUFFER_SIZE, 2000).toString())

        val scalingOptions = arrayOf(SCALING_FIT, SCALING_CROP, SCALING_ORIGINAL)
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, scalingOptions)
        (binding.dropdownScaling as? AutoCompleteTextView)?.apply {
            setAdapter(adapter)
            setText(prefs.getString(KEY_SCALING_MODE, SCALING_FIT), false)
        }
    }

    private fun setupListeners() {
        binding.btnSave.setOnClickListener {
            saveSettings()
            Toast.makeText(this, "Settings Saved", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun saveSettings() {
        val url = binding.editRtmpUrl.text?.toString()?.trim() ?: ""
        val autoReconnect = binding.switchAutoReconnect.isChecked
        val interval = binding.editReconnectInterval.text?.toString()?.toIntOrNull() ?: 3000
        val buffer = binding.editBufferSize.text?.toString()?.toIntOrNull() ?: 2000
        val scaling = binding.dropdownScaling.text?.toString() ?: SCALING_FIT

        prefs.edit()
            .putString(KEY_RTMP_URL, url)
            .putBoolean(KEY_AUTO_RECONNECT, autoReconnect)
            .putInt(KEY_RECONNECT_INTERVAL, interval)
            .putInt(KEY_BUFFER_SIZE, buffer)
            .putString(KEY_SCALING_MODE, scaling)
            .apply()
    }
}
