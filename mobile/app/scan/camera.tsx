import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Button, IconButton, Txt } from '@/components/ui/kit';
import { pickFromLibrary } from '@/lib/photos';
import { prepareScanPhoto, prepareFrame } from '@/lib/prepare-scan-photo';
import { useActions, type LiveCheck } from '@/store/AppStore';
import { NightTheme, useTheme } from '@/theme/ThemeProvider';
import { space, type } from '@/theme/tokens';

const PENDING: LiveCheck = {
  checks: [
    { key: 'light', label: 'Light', ok: false },
    { key: 'steady', label: 'Steady', ok: false },
    { key: 'framing', label: 'Framing', ok: false },
  ],
  ready: false,
  hint: 'Fit your face in the oval',
};
const HOLD_MS = 1500;
const EVERY_MS = 1100;

/**
 * C2 Camera (Night). About once a second it sends a small preview frame to the server's quality
 * check and shows Light, Steady and Framing live; it captures by itself 1.5 s after all three pass.
 * If the checks can't run (offline), the shutter still works and the review screen checks the photo.
 */
function Camera() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { precheck } = useActions();
  const camRef = useRef<ComponentRef<typeof CameraView>>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [torch, setTorch] = useState(false);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState<LiveCheck>(PENDING);
  const [liveDown, setLiveDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const captured = useRef(false);
  const passSince = useRef<number | null>(null);

  const ovalW = Math.min(width * 0.68, 280);
  const ovalH = Math.min(height * 0.44, ovalW * 1.32);

  const capture = useCallback(async () => {
    if (!camRef.current || captured.current) return;
    captured.current = true;
    setBusy(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const photo = await camRef.current.takePictureAsync({ quality: 0.85, shutterSound: false });
      if (!photo?.uri) throw new Error('no photo');
      const uri = await prepareScanPhoto(photo.uri);
      router.replace({ pathname: '/scan/review', params: { uri } });
    } catch {
      captured.current = false;
      passSince.current = null;
      Alert.alert("Couldn't take the photo", 'Hold the phone steady in good light and try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  // Live checks loop.
  useEffect(() => {
    if (!ready) return;
    let stop = false;
    let failures = 0;
    const tick = async () => {
      while (!stop && !captured.current) {
        const started = Date.now();
        try {
          const frame = await camRef.current?.takePictureAsync({ quality: 0.3, skipProcessing: true, shutterSound: false });
          if (frame?.uri && !stop) {
            const small = await prepareFrame(frame.uri);
            const r = await precheck(small);
            if (stop) return;
            failures = 0;
            setLiveDown(false);
            setLive(r);
            if (r.ready) {
              passSince.current ??= Date.now();
              if (Date.now() - passSince.current >= HOLD_MS) {
                void capture();
                return;
              }
            } else {
              passSince.current = null;
            }
          }
        } catch {
          failures += 1;
          if (failures >= 2) setLiveDown(true);
        }
        await new Promise((res) => setTimeout(res, Math.max(150, EVERY_MS - (Date.now() - started))));
      }
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [ready, precheck, capture]);

  const upload = async () => {
    const uri = await pickFromLibrary().catch(() => null);
    if (uri) router.replace({ pathname: '/scan/review', params: { uri } });
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.camera }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.camera, padding: space.screen, paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', gap: space.lg }}>
        <Icon name="photo-camera" size={40} color={colors.textPrimary} />
        <Txt variant="title">Camera access is off</Txt>
        <Txt variant="body" color="secondary">
          DermAI needs the camera to read your skin. Photos stay on your phone.
        </Txt>
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={requestPermission} />
        ) : (
          <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
        )}
        <Button label="Upload a photo instead" variant="ghost" onPress={() => void upload()} />
        <Button label="Not now" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const allPass = live.ready && !liveDown;
  const hint = busy ? 'Got it' : !ready ? 'Starting the camera' : liveDown ? 'Line up your face, then tap the shutter' : allPass ? 'Hold still' : live.hint;

  return (
    <View style={{ flex: 1, backgroundColor: colors.camera }}>
      <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing={facing} enableTorch={torch} mirror={facing === 'front'} onCameraReady={() => setReady(true)} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: ovalW + 28,
            height: ovalH + 24,
            borderRadius: ovalW,
            borderWidth: allPass ? 3 : 2.5,
            borderStyle: allPass ? 'solid' : 'dashed',
            borderColor: allPass ? '#8C7BFF' : '#A594FF',
            boxShadow: `0 0 0 14px rgba(165,148,255,${allPass ? 0.28 : 0.14})`,
          } as object}
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ gap: space.sm, paddingHorizontal: space.screen, paddingTop: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton icon="close" label="Close camera" variant="dark" onPress={() => router.back()} />
            <View style={styles.camChip}>
              <Text style={[type.smallStrong, { color: '#EEE9FF' }]}>{facing === 'front' ? 'Front camera' : 'Back camera'}</Text>
            </View>
            <IconButton icon={torch ? 'flash-on' : 'flash-off'} label={torch ? 'Turn light off' : 'Turn light on'} variant="dark" onPress={() => setTorch((v) => !v)} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' }} accessibilityLiveRegion="polite">
            {live.checks.map((c) => {
              const pending = !ready || liveDown;
              const ok = c.ok && !pending;
              const warn = !ok && !pending && c.key === 'framing';
              return (
                <View
                  key={c.key}
                  style={[styles.check, { backgroundColor: ok ? 'rgba(23,133,90,0.25)' : warn ? 'rgba(255,214,110,0.18)' : 'rgba(45,35,80,0.8)' }]}
                  accessibilityLabel={`${c.label}, ${ok ? 'passed' : 'not yet'}`}>
                  <Icon name={ok ? 'check-circle' : warn ? 'zoom-in' : 'radio-button-unchecked'} size={15} color={ok ? '#7FE7B9' : warn ? '#FFD66E' : 'rgba(238,233,255,0.6)'} />
                  <Text style={[type.small, { color: ok ? '#7FE7B9' : warn ? '#FFD66E' : '#EEE9FF' }]}>{c.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ gap: space.lg, paddingBottom: space.lg }}>
          <Text style={[type.heading, { color: '#EEE9FF', textAlign: 'center' }]} accessibilityLiveRegion="polite">
            {hint}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <IconButton icon="photo-library" label="Upload a photo" variant="dark" onPress={() => void upload()} />
            <Pressable onPress={() => void capture()} disabled={!ready || busy} accessibilityRole="button" accessibilityLabel="Take photo now" style={styles.shutter}>
              <View style={[styles.shutterInner, { opacity: allPass ? 1 : 0.4 }]} />
            </Pressable>
            <IconButton icon="cameraswitch" label="Switch camera" variant="dark" onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function CameraScreen() {
  return (
    <NightTheme>
      <Camera />
    </NightTheme>
  );
}

const styles = StyleSheet.create({
  camChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(45,35,80,0.8)' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEE9FF' },
});
