import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraControls } from '@/components/scan/CameraControls';
import { CameraPermissionState } from '@/components/scan/CameraPermissionState';
import { FaceGuideOverlay } from '@/components/scan/FaceGuideOverlay';
import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { APP_ROUTES } from '@/constants/navigation';
import { useScan } from '@/context/ScanContext';
import { SCAN_CAMERA_BG } from '@/constants/scanTheme';
import { prepareScanPhoto } from '@/lib/prepare-scan-photo';
import { getThemeGradients } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';

const SCAN_TIPS = [
  'Face the camera directly',
  'Keep a neutral expression',
  'Avoid shadows',
  'Hold the phone at eye level',
];

function createScanStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: SCAN_CAMERA_BG,
    },
    safeArea: {
      flex: 1,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerTitle: {
      fontSize: FONT.subtitle,
      fontWeight: '600',
      color: colors.textInverse,
    },
    guidance: {
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    },
    guidancePrimary: {
      fontSize: FONT.subtitle,
      fontWeight: '600',
      color: colors.textInverse,
      textAlign: 'center',
      marginBottom: SPACING.xs,
    },
    guidanceSecondary: {
      fontSize: FONT.caption + 1,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    footer: {
      paddingBottom: SPACING.lg,
      gap: SPACING.md,
    },
    galleryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      minHeight: 44,
      minWidth: 44,
    },
    galleryButtonText: {
      fontSize: FONT.body,
      fontWeight: '600',
      color: colors.secondary,
    },
    galleryButtonDisabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

export default function ScanCameraScreen() {
  const router = useRouter();
  const { setPhoto } = useScan();
  const cameraRef = useRef<ComponentRef<typeof CameraView>>(null);
  const { colors, isDark, resolvedTheme } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);
  const styles = useMemo(() => createScanStyles(colors), [colors, isDark]);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const navigateWithPhoto = useCallback(
    async (uri: string) => {
      const preparedUri = await prepareScanPhoto(uri);
      setPhoto(preparedUri);
      router.push(APP_ROUTES.scanReview);
    },
    [router, setPhoto],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleHelp = useCallback(() => {
    Alert.alert(
      'Scan tips',
      SCAN_TIPS.map((tip) => `• ${tip}`).join('\n'),
      [{ text: 'Got it' }],
    );
  }, []);

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  const handleFlip = useCallback(() => {
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  }, []);

  const handleFlashToggle = useCallback(() => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessingPhoto || !isCameraReady) {
      return;
    }

    setIsProcessingPhoto(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Capture failed');
      }

      await navigateWithPhoto(photo.uri);
    } catch {
      Alert.alert(
        'Capture failed',
        'We could not capture your photo. Please try again with steady hands and good lighting.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [isCameraReady, isProcessingPhoto, navigateWithPhoto]);

  const handlePickFromGallery = useCallback(async () => {
    if (isProcessingPhoto) {
      return;
    }

    setIsProcessingPhoto(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access is required',
          'Allow access to your photo library to upload a face photo for skin analysis.',
          permission.canAskAgain
            ? [{ text: 'OK' }]
            : [
                { text: 'Not now', style: 'cancel' },
                { text: 'Open Settings', onPress: () => void Linking.openSettings() },
              ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
        exif: false,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      await navigateWithPhoto(result.assets[0].uri);
    } catch {
      Alert.alert(
        'Upload failed',
        'We could not load the selected photo. Please try another image.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [isProcessingPhoto, navigateWithPhoto]);

  if (!permission) {
    return (
      <View style={styles.root}>
        <CameraPermissionState
          isLoading
          onRequestPermission={handleRequestPermission}
          onGoBack={handleClose}
          buttonGradient={gradients.scan}
        />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <CameraPermissionState
          isDenied={!permission.canAskAgain}
          onRequestPermission={handleRequestPermission}
          onGoBack={handleClose}
          buttonGradient={gradients.scan}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mirror={facing === 'front'}
        onCameraReady={() => setIsCameraReady(true)}
      />

      <FaceGuideOverlay showScanLine showLandmarks variant="camera" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <Ionicons name="close" size={24} color={colors.textInverse} />
          </Pressable>

          <Text style={styles.headerTitle}>AI Skin Scan</Text>

          <Pressable
            onPress={handleHelp}
            accessibilityRole="button"
            accessibilityLabel="Scan help and tips"
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.secondary} />
          </Pressable>
        </View>

        <View style={styles.guidance}>
          <Text style={styles.guidancePrimary}>Position your face inside the frame</Text>
          <Text style={styles.guidanceSecondary}>
            Use even lighting and remove glasses if possible
          </Text>
        </View>

        <View style={styles.footer}>
          <CameraControls
            facing={facing}
            flashEnabled={flash === 'on'}
            isCapturing={isProcessingPhoto}
            onCapture={handleCapture}
            onFlip={handleFlip}
            onFlashToggle={handleFlashToggle}
            captureGradient={gradients.scan}
            accentColor={colors.secondary}
            iconColor={colors.textInverse}
          />

          <Pressable
            onPress={handlePickFromGallery}
            disabled={isProcessingPhoto}
            accessibilityRole="button"
            accessibilityLabel="Choose photo from gallery"
            accessibilityState={{ disabled: isProcessingPhoto }}
            style={({ pressed }) => [
              styles.galleryButton,
              isProcessingPhoto && styles.galleryButtonDisabled,
              pressed && !isProcessingPhoto && styles.pressed,
            ]}>
            <Ionicons name="images-outline" size={20} color={colors.secondary} />
            <Text style={styles.galleryButtonText}>Choose from gallery</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
