import { Alert, Linking } from 'react-native';

// Canonical hosted Terms of Service + Privacy Policy (GitHub Pages, served
// from repo-root /docs on main). Single source of truth — do not inline this
// URL elsewhere, and keep it in sync with the App Store Connect submission
// checklist entry.
export const LEGAL_URL = 'https://justinbchau.github.io/toodaloo/legal/';

// Open the hosted Terms & Privacy page in the system browser. Single source of
// truth for both the landing footer and the Settings row.
export async function openLegal(): Promise<void> {
  try {
    await Linking.openURL(LEGAL_URL);
  } catch {
    Alert.alert('Error', 'Could not open the Terms & Privacy page.');
  }
}
