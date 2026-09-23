// Simulates only the native routing branch, not Capacitor or device APIs.
export const isNative = () => true;
export const isIOS = () => false;
export const isAndroid = () => true;
export const isWeb = () => false;
export const PRODUCTION_URL = 'https://event-bliss.com';
export const getBaseUrl = () => location.origin;
