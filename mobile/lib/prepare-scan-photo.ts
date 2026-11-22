import * as ImageManipulator from 'expo-image-manipulator';

/** Full scan photo: 1080 px wide JPEG. */
export async function prepareScanPhoto(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1080 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
  return manipulated.uri;
}

/** Live-check frame: small and light so it can go up about once a second. */
export async function prepareFrame(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 480 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG });
  return manipulated.uri;
}
