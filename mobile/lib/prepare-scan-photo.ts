import * as ImageManipulator from 'expo-image-manipulator';

export async function prepareScanPhoto(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );

  return manipulated.uri;
}
