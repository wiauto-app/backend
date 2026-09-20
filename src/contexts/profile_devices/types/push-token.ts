/**
 * Token APNs crudo (hex, 64+ caracteres). `expo-notifications` lo devuelve en iOS con
 * `getDevicePushTokenAsync`; no es un token FCM ni Expo, así que no se puede usar para enviar.
 */
const RAW_APNS_TOKEN_REGEX = /^[0-9a-fA-F]{64,}$/;

/** Formato de Expo Push Token: `ExponentPushToken[...]` o `ExpoPushToken[...]`. */
const EXPO_PUSH_TOKEN_REGEX = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export const isRawApnsToken = (token: string): boolean =>
  RAW_APNS_TOKEN_REGEX.test(token);

export const isExpoPushTokenFormat = (token: string): boolean =>
  EXPO_PUSH_TOKEN_REGEX.test(token);
