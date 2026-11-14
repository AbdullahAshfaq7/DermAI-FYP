import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Button, IconButton, Txt } from '@/components/ui/kit';
import { pickFromLibrary } from '@/lib/photos';
import { prepareScanPhoto } from '@/lib/prepare-scan-photo';
import { useTheme } from '@/theme/ThemeProvider';
import { space, type } from '@/theme/tokens';

const CHECKS = [
  { key: 'face', label: 'One face' },
  { key: 'sharp', label: 'Sharp' },
  { key: 'light', label: 'Even light' },
] as const;

/**
 * C2 Camera: captures automatically once all three checks pass.
 * The checks are simulated on a timer until on-device face, blur and exposure detection is added (PRD FR-3).
 */
export default function Camera() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const camRef = useRef<ComponentRef<typeof CameraView>>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [torch, setTorch] = useState(false);
  const [ready, setReady] = useState(false);
  const [passed, setPassed] = useState(0);
  const [busy, setBusy] = useState(false);
  const captured = useRef(false);

  const ovalW = Math.min(width * 0.68, 280);
  const ovalH = Math.min(height * 0.42, ovalW * 1.32);
  const allPass = passed >= CHECKS.length;

  const capture = useCallback(async () => {
    if (!camRef.current || busy || captured.current) return;
    captured.current = true;
    setBusy(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const photo = await camRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error('no photo');
      const uri = await prepareScanPhoto(photo.uri);
      router.replace({ pathname: '/scan/review', params: { uri } });
    } catch {
      captured.current = false;
      setPassed(0);
      Alert.alert('Couldn\'t take the photo', 'Hold the phone steady in good light and try again.');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Simulated live checks: tick one by one once the camera is ready, then auto-capture after 1.5 s.
  useEffect(() => {
    if (!ready || captured.current) return;
    if (passed < CHECKS.length) {
      const t = setTimeout(() => setPassed((p) => p + 1), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(capture, 1500);
    return () => clearTimeout(t);
  }, [ready, passed, capture]);

  const upload = async () => {
    const uri = await pickFromLibrary().catch(() => null);
    if (uri) router.replace({ pathname: '/scan/review', params: { uri } });
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.camera }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.camera, padding: space.screen, paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', gap: space.lg }}>
        <Icon name="photo-camera" size={40} color="#FFFFFF" />
        <Txt variant="title" color="onFill">
          Camera access is off
        </Txt>
        <Txt variant="body" style={{ color: 'rgba(255,255,255,0.75)' }}>
          DermAI needs the camera to read your skin. Photos stay private to you.
        </Txt>
        {permission.canAskAgain ? (
          <Button label="Allow camera" variant="brand" onPress={requestPermission} />
        ) : (
          <Button label="Open Settings" variant="brand" onPress={() => void Linking.openSettings()} />
        )}
        <Button label="Upload a photo instead" variant="ghost" onPress={upload} />
        <Button label="Not now" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.camera }}>
      <CameraView
        ref={camRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
        mirror={facing === 'front'}
        onCameraReady={() => setReady(true)}
      />
      {/* Dim everything outside the oval. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: ovalW,
            height: ovalH,
            borderRadius: ovalW,
            borderWidth: allPass ? 4 : 2.5,
            borderColor: allPass ? colors.brand : 'rgba(255,255,255,0.75)',
            shadowColor: colors.brand,
            shadowOpacity: allPass ? 0.9 : 0,
            shadowRadius: 18,
          }}
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.screen, paddingTop: space.sm }}>
          <IconButton icon="close" label="Close camera" variant="dark" onPress={() => router.back()} />
          <IconButton icon={torch ? 'flash-on' : 'flash-off'} label={torch ? 'Turn light off' : 'Turn light on'} variant="dark" onPress={() => setTorch((v) => !v)} />
        </View>
        <View style={{ gap: space.lg, paddingBottom: space.lg }}>
          <Text style={[type.heading, { color: '#FFFFFF', textAlign: 'center' }]} accessibilityLiveRegion="polite">
            {busy ? 'Got it' : allPass ? 'Hold still' : 'Fit your face in the oval'}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' }}>
            {CHECKS.map((c, i) => (
              <View key={c.key} style={[styles.check, { backgroundColor: i < passed ? 'rgba(79,179,166,0.3)' : 'rgba(255,255,255,0.1)' }]}>
                <Icon name={i < passed ? 'check-circle' : 'radio-button-unchecked'} size={16} color={i < passed ? '#7FD3C5' : 'rgba(255,255,255,0.6)'} />
                <Text style={[type.small, { color: '#FFFFFF' }]}>{c.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <IconButton icon="photo-library" label="Upload a photo" variant="dark" onPress={upload} />
            <Pressable
              onPress={capture}
              disabled={!ready || busy}
              accessibilityRole="button"
              accessibilityLabel="Take photo now"
              style={[styles.shutter, { borderColor: '#FFFFFF' }]}>
              <View style={[styles.shutterInner, { backgroundColor: allPass ? colors.brand : '#9BD3CA' }]} />
            </Pressable>
            <IconButton icon="cameraswitch" label="Switch camera" variant="dark" onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30 },
});
