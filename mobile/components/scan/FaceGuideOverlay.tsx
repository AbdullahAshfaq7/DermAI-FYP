import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { FACE_GUIDE, getScanColors, SCAN_CAMERA_OVERLAY } from '@/constants/scanTheme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FaceGuideOverlayProps {
  showScanLine?: boolean;
  showLandmarks?: boolean;
  variant?: 'camera' | 'review';
}

const LANDMARKS = [
  { top: '22%', left: '50%' },
  { top: '38%', left: '32%' },
  { top: '38%', left: '68%' },
  { top: '52%', left: '50%' },
  { top: '68%', left: '38%' },
  { top: '68%', left: '62%' },
];

export function FaceGuideOverlay({
  showScanLine = true,
  showLandmarks = true,
  variant = 'camera',
}: FaceGuideOverlayProps) {
  const { colors } = useAppTheme();
  const scanColors = useMemo(() => getScanColors(colors), [colors]);
  const scanLineY = useSharedValue(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          ...ABSOLUTE_FILL_STYLE,
        },
        overlayTop: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: SCAN_CAMERA_OVERLAY.overlay,
        },
        overlayBottom: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: SCAN_CAMERA_OVERLAY.overlay,
        },
        middleRow: {
          position: 'absolute',
          left: 0,
          right: 0,
          flexDirection: 'row',
        },
        overlaySide: {
          backgroundColor: SCAN_CAMERA_OVERLAY.overlay,
        },
        guideArea: {
          width: FACE_GUIDE.width,
          height: FACE_GUIDE.height,
          position: 'relative',
        },
        ovalBorder: {
          ...ABSOLUTE_FILL_STYLE,
          borderRadius: FACE_GUIDE.borderRadius,
          borderWidth: 2,
          borderColor: scanColors.guideBorder,
        },
        corner: {
          position: 'absolute',
          width: FACE_GUIDE.cornerSize,
          height: FACE_GUIDE.cornerSize,
          borderColor: scanColors.guideCorner,
        },
        cornerTopLeft: {
          top: -1,
          left: -1,
          borderTopWidth: 3,
          borderLeftWidth: 3,
          borderTopLeftRadius: 12,
        },
        cornerTopRight: {
          top: -1,
          right: -1,
          borderTopWidth: 3,
          borderRightWidth: 3,
          borderTopRightRadius: 12,
        },
        cornerBottomLeft: {
          bottom: -1,
          left: -1,
          borderBottomWidth: 3,
          borderLeftWidth: 3,
          borderBottomLeftRadius: 12,
        },
        cornerBottomRight: {
          bottom: -1,
          right: -1,
          borderBottomWidth: 3,
          borderRightWidth: 3,
          borderBottomRightRadius: 12,
        },
        landmark: {
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: scanColors.landmark,
          marginLeft: -3,
          marginTop: -3,
        },
        guideLine: {
          position: 'absolute',
          backgroundColor: scanColors.guideLine,
        },
        guideLineHorizontal: {
          left: '15%',
          right: '15%',
          height: 1,
        },
        guideLineVertical: {
          top: '18%',
          bottom: '18%',
          width: 1,
          marginLeft: -0.5,
        },
        scanLine: {
          position: 'absolute',
          left: 12,
          right: 12,
          height: 2,
        },
        scanLineGlow: {
          height: 2,
          backgroundColor: scanColors.scanLine,
          shadowColor: scanColors.scanLine,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
        },
        containedRoot: {
          ...ABSOLUTE_FILL_STYLE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containedGuide: {
          width: '68%',
          height: '72%',
          position: 'relative',
        },
        reviewOverlay: {
          ...ABSOLUTE_FILL_STYLE,
          backgroundColor: SCAN_CAMERA_OVERLAY.reviewOverlay,
        },
      }),
    [scanColors],
  );

  useEffect(() => {
    if (!showScanLine) {
      return;
    }
    scanLineY.value = withRepeat(
      withTiming(FACE_GUIDE.height - 4, {
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [scanLineY, showScanLine]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  if (variant === 'review') {
    return (
      <View style={styles.containedRoot} pointerEvents="none">
        <View style={styles.containedGuide}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          <View style={styles.ovalBorder} />
        </View>
        <View style={styles.reviewOverlay} />
      </View>
    );
  }

  const guideLeft = (SCREEN_WIDTH - FACE_GUIDE.width) / 2;
  const guideTop = (SCREEN_HEIGHT - FACE_GUIDE.height) / 2 - 40;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.overlayTop, { height: guideTop }]} />
      <View style={[styles.middleRow, { top: guideTop, height: FACE_GUIDE.height }]}>
        <View style={[styles.overlaySide, { width: guideLeft }]} />
        <View style={styles.guideArea}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          <View style={styles.ovalBorder} />

          {showLandmarks &&
            LANDMARKS.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.landmark,
                  {
                    top: point.top as `${number}%`,
                    left: point.left as `${number}%`,
                  },
                ]}
              />
            ))}

          {showLandmarks && (
            <>
              <View style={[styles.guideLine, styles.guideLineHorizontal, { top: '38%' }]} />
              <View style={[styles.guideLine, styles.guideLineHorizontal, { top: '62%' }]} />
              <View style={[styles.guideLine, styles.guideLineVertical, { left: '50%' }]} />
            </>
          )}

          {showScanLine && (
            <Animated.View style={[styles.scanLine, scanLineStyle]}>
              <View style={styles.scanLineGlow} />
            </Animated.View>
          )}
        </View>
        <View style={[styles.overlaySide, { width: guideLeft }]} />
      </View>
      <View style={[styles.overlayBottom, { top: guideTop + FACE_GUIDE.height }]} />
    </View>
  );
}
