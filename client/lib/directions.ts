import { Alert, Linking, Platform } from 'react-native';

/**
 * Open walking directions to a point in the platform maps app (Apple Maps on
 * iOS, Google Maps elsewhere), falling back to the universal Google Maps URL.
 */
export async function openDirections(lat: number, lng: number, name: string): Promise<void> {
  const label = encodeURIComponent(name);
  const primary = Platform.select({
    ios: `maps://?daddr=${lat},${lng}&q=${label}&dirflg=w`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
  })!;
  const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  try {
    const canOpen = await Linking.canOpenURL(primary);
    await Linking.openURL(canOpen ? primary : webFallback);
  } catch {
    try {
      await Linking.openURL(webFallback);
    } catch {
      Alert.alert('Error', 'Could not open maps.');
    }
  }
}
