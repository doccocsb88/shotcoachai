import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { LEGAL_DOCUMENT_MODULES, type LegalDocumentKey } from '../../constants/legal';
import { colors } from '../../constants/theme';
import { ScreenNavBar } from './ScreenNavBar';

interface AppWebViewProps {
  title: string;
  documentKey?: LegalDocumentKey;
  url?: string;
  visible: boolean;
  onClose: () => void;
}

async function resolveWebViewUri(documentKey?: LegalDocumentKey, url?: string): Promise<string | null> {
  if (documentKey) {
    const asset = Asset.fromModule(LEGAL_DOCUMENT_MODULES[documentKey]);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri;
  }

  return url ?? null;
}

export function AppWebView({ title, documentKey, url, visible, onClose }: AppWebViewProps) {
  const insets = useSafeAreaInsets();
  const [sourceUri, setSourceUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSourceUri(null);
      return;
    }

    let cancelled = false;
    void resolveWebViewUri(documentKey, url).then(resolvedUri => {
      if (!cancelled) {
        setSourceUri(resolvedUri);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [documentKey, url, visible]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <ScreenNavBar title={title} leadingLabel="Back" onLeadingPress={onClose} />
        {sourceUri ? (
          <WebView
            originWhitelist={['*']}
            source={{ uri: sourceUri }}
            style={styles.webView}
          />
        ) : null}
      </View>
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
