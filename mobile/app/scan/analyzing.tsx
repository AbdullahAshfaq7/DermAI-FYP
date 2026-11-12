import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalysisProgress } from '@/components/scan/AnalysisProgress';
import { ScanDisclaimer } from '@/components/scan/ScanDisclaimer';
import { SPACING } from '@/constants/homeTheme';
import { APP_ROUTES } from '@/constants/navigation';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { getScanColors, SCAN_CAMERA_BG_DEEP } from '@/constants/scanTheme';
import { ANALYSIS_STAGES } from '@/data/skinScanResult';
import { useScan } from '@/context/ScanContext';
import { useAppTheme } from '@/theme/useAppTheme';

const ANALYSIS_DURATION_MS = 5000;
const TICK_INTERVAL_MS = 50;

function getStageLabel(progress: number): string {
  const stage = ANALYSIS_STAGES.find((item) => progress >= item.min && progress <= item.max);
  return stage?.label ?? ANALYSIS_STAGES[ANALYSIS_STAGES.length - 1].label;
}

function createAnalyzingStyles(scanColors: ReturnType<typeof getScanColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: SCAN_CAMERA_BG_DEEP,
    },
    backgroundImage: {
      ...ABSOLUTE_FILL_STYLE,
      opacity: 0.25,
    },
    overlay: {
      ...ABSOLUTE_FILL_STYLE,
      backgroundColor: 'rgba(10, 22, 40, 0.88)',
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: SPACING.lg,
      gap: SPACING.lg,
    },
    imageCard: {
      alignSelf: 'center',
      width: 140,
      height: 140,
      borderRadius: 70,
      overflow: 'hidden',
      marginBottom: SPACING.sm,
    },
    faceImage: {
      width: '100%',
      height: '100%',
    },
    imageBorder: {
      ...ABSOLUTE_FILL_STYLE,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: scanColors.guideCorner,
    },
  });
}

export default function ScanAnalyzingScreen() {
  const router = useRouter();
  const { session, startAnalysis, completeAnalysis } = useScan();
  const [progress, setProgress] = useState(0);
  const { colors } = useAppTheme();
  const scanColors = useMemo(() => getScanColors(colors), [colors]);
  const styles = useMemo(() => createAnalyzingStyles(scanColors), [scanColors]);

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const hasStartedAnalysisRef = useRef(false);

  useEffect(() => {
    if (!session.photoUri) {
      router.replace(APP_ROUTES.scan);
      return;
    }

    if (session.analysisStatus === 'idle') {
      router.replace(APP_ROUTES.scan);
      return;
    }

    if (session.analysisStatus === 'completed') {
      router.replace(APP_ROUTES.scanResults);
      return;
    }

    if (session.analysisStatus === 'captured') {
      if (!hasStartedAnalysisRef.current) {
        hasStartedAnalysisRef.current = true;
        startAnalysis();
      }
      return;
    }

    hasStartedAnalysisRef.current = true;
  }, [router, session.analysisStatus, session.photoUri, startAnalysis]);

  const finishAnalysis = useCallback(() => {
    if (hasCompletedRef.current) {
      return;
    }
    hasCompletedRef.current = true;
    setProgress(100);
    completeAnalysis();
    router.replace(APP_ROUTES.scanResults);
  }, [completeAnalysis, router]);

  useEffect(() => {
    if (session.analysisStatus !== 'analyzing' && session.analysisStatus !== 'captured') {
      return;
    }

    startTimeRef.current = Date.now();
    hasCompletedRef.current = false;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const nextProgress = Math.min((elapsed / ANALYSIS_DURATION_MS) * 100, 100);
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        finishAnalysis();
      }
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [finishAnalysis, session.analysisStatus]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Leave analysis?',
        'Your scan is still being processed. Leaving now will cancel the analysis.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => router.replace(APP_ROUTES.scanReview),
          },
        ],
      );
      return true;
    });

    return () => subscription.remove();
  }, [router]);

  if (!session.photoUri) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Image source={{ uri: session.photoUri }} style={styles.backgroundImage} contentFit="cover" />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.imageCard}>
            <Image source={{ uri: session.photoUri }} style={styles.faceImage} contentFit="cover" />
            <View style={styles.imageBorder} />
          </View>

          <AnalysisProgress progress={progress} stageLabel={getStageLabel(progress)} />
          <ScanDisclaimer variant="dark" />
        </View>
      </SafeAreaView>
    </View>
  );
}
