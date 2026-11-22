import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { prepareScanPhoto } from '@/lib/prepare-scan-photo';

/** Pick a face photo from the library and resize it for upload. */
export async function pickFromLibrary(opts: { square?: boolean } = {}): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Photo access is off',
      'Allow DermAI to read your photos to upload a face photo.',
      perm.canAskAgain ? [{ text: 'OK' }] : [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => void Linking.openSettings() }],
    );
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: opts.square ? [1, 1] : [3, 4], quality: 0.85, exif: false });
  if (res.canceled || !res.assets[0]?.uri) return null;
  return prepareScanPhoto(res.assets[0].uri);
}
