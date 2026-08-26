import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

import {
  CameraOutlineIcon,
  DownloadOutlineIcon,
  ShareOutlineIcon
} from '../icons/ResultActionIcons';
import { colors, shadows } from '../../constants/theme';

export type PhotoResultActionDockVariant = 'light' | 'immersive';

interface Props {
  variant?: PhotoResultActionDockVariant;
  busy?: boolean;
  retakeDisabled?: boolean;
  saveDisabled?: boolean;
  shareDisabled?: boolean;
  onRetake: () => void;
  onSave: () => void;
  onShare: () => void;
}

/**
 * Retake / Save / Share dock shared by GeneratedResultScreen and pose Your shot preview.
 * Icons and sizes stay identical; immersive variant uses glass buttons on dark photo chrome.
 */
export function PhotoResultActionDock({
  variant = 'light',
  busy = false,
  retakeDisabled = false,
  saveDisabled = false,
  shareDisabled = false,
  onRetake,
  onSave,
  onShare
}: Props) {
  const isImmersive = variant === 'immersive';
  const sideIconColor = isImmersive ? colors.white : colors.text;
  const retakeBlocked = retakeDisabled || busy;
  const saveBlocked = saveDisabled || busy;
  const shareBlocked = shareDisabled || busy;

  const renderSideAction = (
    label: string,
    accessibilityLabel: string,
    icon: ReactNode,
    onPress: () => void,
    disabled: boolean
  ) => {
    if (isImmersive) {
      return (
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [
            styles.glassActionOuter,
            disabled && styles.actionDisabled,
            pressed && !disabled && styles.pressed
          ]}
        >
          <BlurView intensity={48} tint="dark" style={styles.glassActionButton}>
            {icon}
            <Text style={styles.immersiveSideActionLabel}>{label}</Text>
          </BlurView>
        </Pressable>
      );
    }

    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.sideActionButton,
          disabled && styles.actionDisabled,
          pressed && !disabled && styles.pressed
        ]}
      >
        {icon}
        <Text style={styles.sideActionLabel}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.actionDock, isImmersive && styles.actionDockImmersive]}>
      <View style={styles.bottomActionsRow}>
        {renderSideAction(
          'Retake',
          'Retake photo',
          <CameraOutlineIcon size={20} color={sideIconColor} />,
          onRetake,
          retakeBlocked
        )}

        <Pressable
          accessibilityLabel="Save photo"
          accessibilityRole="button"
          disabled={saveBlocked}
          onPress={onSave}
          style={({ pressed }) => [
            styles.saveFab,
            saveBlocked && styles.saveButtonDisabled,
            pressed && !saveBlocked && styles.pressed
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <DownloadOutlineIcon size={22} color={colors.white} />
              <Text style={styles.saveFabLabel}>Save</Text>
            </>
          )}
        </Pressable>

        {renderSideAction(
          'Share',
          'Share photo',
          <ShareOutlineIcon size={20} color={sideIconColor} />,
          onShare,
          shareBlocked
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionDock: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    paddingHorizontal: 16,
    paddingTop: 4
  },
  actionDockImmersive: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 0
  },
  bottomActionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between'
  },
  sideActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    maxWidth: 88,
    minHeight: 62,
    paddingVertical: 8,
    ...shadows.soft
  },
  sideActionLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700'
  },
  glassActionOuter: {
    borderRadius: 18,
    flex: 1,
    maxWidth: 88,
    overflow: 'hidden'
  },
  glassActionButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 62,
    overflow: 'hidden',
    paddingVertical: 8
  },
  immersiveSideActionLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700'
  },
  saveFab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 31,
    height: 62,
    justifyContent: 'center',
    marginHorizontal: 2,
    width: 62,
    ...shadows.button
  },
  saveFabLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2
  },
  saveButtonDisabled: {
    opacity: 0.45
  },
  actionDisabled: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.65
  }
});
