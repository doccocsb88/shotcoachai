import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors } from '../../constants/theme';

interface Props {
  onBack: () => void;
}

const privacyPolicyUrl = 'https://google.com';

export function PrivacyPolicyScreen({ onBack }: Props) {
  return (
    <View style={styles.root}>
      <ScreenNavBar title="Privacy Policy" leadingLabel="Back" onLeadingPress={onBack} />
      <WebView source={{ uri: privacyPolicyUrl }} style={styles.webView} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  webView: {
    backgroundColor: colors.background,
    flex: 1
  }
});
