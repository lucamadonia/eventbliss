import { PushNotifications } from '@capacitor/push-notifications';
import { registerPlugin } from '@capacitor/core';
import { isAndroid, isNative } from './platform';

const FirebaseStatus = registerPlugin<{ isConfigured(): Promise<{ configured: boolean }> }>('FirebaseStatus');

export async function initPushNotifications(): Promise<void> {
  if (!isNative()) return;

  try {
    // Android's push plugin crashes the whole process if no default Firebase app exists.
    // Keep the rest of the app usable until google-services.json is configured.
    if (isAndroid() && !(await FirebaseStatus.isConfigured()).configured) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.addListener('registration', () => {
      console.info('Push registration succeeded');
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action:', notification);
    });

    await PushNotifications.register();
  } catch (error) {
    console.error('Push notifications are unavailable:', error);
  }
}
