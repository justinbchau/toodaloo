import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import { useThemeContext } from '../context/ThemeContext';

const LAST_UPDATED = 'July 2026';

/**
 * In-app Terms of Service + Privacy Policy.
 *
 * NOTE: This is baseline copy so the app has real, linkable legal pages (App
 * Store review requires them). It is not legal advice — the team should have
 * counsel review and adjust the wording before a production release.
 */
export function Legal() {
  const { colors } = useThemeContext();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View>
      <Text style={[styles.h2, { color: colors.text1 }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.text2 }]}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.text1 }]}>Terms & Privacy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.updated, { color: colors.text3 }]}>Last updated: {LAST_UPDATED}</Text>

        <Text style={[styles.h1, { color: colors.text1 }]}>Terms of Service</Text>
        <Section title="Acceptance">
          By creating an account or using toodaloo you agree to these terms. If you do not agree,
          please do not use the app.
        </Section>
        <Section title="What toodaloo is">
          toodaloo is a community-driven directory of public bathrooms. Listings, ratings, and
          reviews are contributed by users and are provided for informational purposes only. We do
          not own, operate, or guarantee access to any location shown in the app.
        </Section>
        <Section title="Your contributions">
          You are responsible for the content you submit (bathroom listings and reviews). Do not
          submit content that is false, unlawful, offensive, or infringes anyone's rights. You grant
          toodaloo a non-exclusive license to display and distribute your contributions within the
          app. We may remove content that violates these terms.
        </Section>
        <Section title="Accuracy & availability">
          Bathroom information may be inaccurate, out of date, or unavailable. Access rules, hours,
          and amenities can change without notice. Always respect the policies of the establishment
          you are visiting. Use the app at your own risk.
        </Section>
        <Section title="Termination">
          We may suspend or terminate access to the service for conduct that violates these terms or
          harms other users.
        </Section>

        <Text style={[styles.h1, { color: colors.text1, marginTop: 28 }]}>Privacy Policy</Text>
        <Section title="Information we collect">
          We collect the email address you use to sign in, the username you choose, and the content
          you create (listings, reviews, saved places). When you use the map, your device location
          is used on-device to find nearby bathrooms; we do not store your continuous location
          history.
        </Section>
        <Section title="How we use it">
          We use your information to operate core features: authenticating you, showing nearby
          bathrooms, attributing your reviews to your username, and keeping your saved list. We do
          not sell your personal information.
        </Section>
        <Section title="Data storage">
          Account and content data is stored with our backend provider (Supabase). Authentication
          tokens are stored securely on your device.
        </Section>
        <Section title="Your choices">
          You can edit your username in Settings and sign out at any time. To request deletion of
          your account and associated data, contact us at the address below.
        </Section>
        <Section title="Contact">
          Questions about these terms or your privacy? Email hello@toodaloo.app.
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  title: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20 },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  updated: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 20 },
  h1: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', marginBottom: 12 },
  h2: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 16, marginBottom: 6 },
  body: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 21 },
});
