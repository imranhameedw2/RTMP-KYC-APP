import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../androidCode/projectFiles';

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Add all Android Studio Kotlin & Gradle files
  ANDROID_PROJECT_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  // Add the GitHub Actions workflow
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Android APK
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - uses: android-actions/setup-android@v3
      - run: chmod +x ./gradlew || true
      - run: ./gradlew assembleDebug --stacktrace
      - uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
`
  );

  // Add quick build script
  zip.file(
    'build-apk.sh',
    `#!/usr/bin/env bash
# Quick build script for RTMP Virtual Camera
echo "Building debug APK..."
./gradlew assembleDebug
echo "APK generated at: app/build/outputs/apk/debug/app-debug.apk"
`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = 'RTMPVirtualCamera-AndroidStudio.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
