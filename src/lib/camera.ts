import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './platform';

export async function takePhoto(): Promise<string | null> {
  if (!isNative()) return null;

  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
    });
    return photo.webPath ?? null;
  } catch {
    return null;
  }
}
