import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors } from '../../constants/theme';
import { ScreenNavBar } from './ScreenNavBar';

interface AppWebViewProps {
  title: string;
  url: string;
  visible: boolean;
  onClose: () => void;
}

export function AppWebView({ title, url, visible, onClose }: AppWebViewProps) {
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <ScreenNavBar title={title} leadingLabel="Back" onLeadingPress={onClose} />
        {visible ? <WebView source={{ uri: url }} style={styles.webView} /> : null}
      </SafeAreaView>
    </Modal>
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
