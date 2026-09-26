package com.example.rtmpvirtualcamera.storage

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
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Handles saving photos and video recordings into Android's public MediaStore
 * in full compliance with Android 10+ Scoped Storage requirements.
 */
class MediaStorageManager(private val context: Context) {

    private val dateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US)

    /**
     * Saves a snapshot Bitmap to the user's gallery (Pictures/RTMPVirtualCamera).
     */
    suspend fun savePhoto(bitmap: Bitmap): Uri? = withContext(Dispatchers.IO) {
        val fileName = "IMG_${dateFormat.format(Date())}.jpg"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/RTMPVirtualCamera")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }

            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)

            if (uri != null) {
                resolver.openOutputStream(uri)?.use { outputStream ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream)
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

            FileOutputStream(file).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
            }
            Uri.fromFile(file)
        }
    }

    /**
     * Creates an output destination Uri for recording an MP4 video (Movies/RTMPVirtualCamera).
     */
    fun createVideoMediaUri(): Pair<Uri?, String> {
        val fileName = "REC_${dateFormat.format(Date())}.mp4"

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
                put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/RTMPVirtualCamera")
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

    /**
     * Marks the video file as complete and ready for indexing by the Android media scanner.
     */
    fun finishVideoPending(uri: Uri) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.Video.Media.IS_PENDING, 0)
            }
            context.contentResolver.update(uri, contentValues, null, null)
        }
    }
}
