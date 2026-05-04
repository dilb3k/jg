import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../theme';
import { useTheme } from '../store/themeStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Club Bar' }: HeaderProps) {
  const { colors } = useTheme();
  const { isOnline, syncStatus } = useNetworkStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.secondary : colors.danger }]} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>{isOnline ? 'Online' : 'Offline'}</Text>
        {syncStatus.pendingCount > 0 && (
          <View style={[styles.syncBadge, { backgroundColor: colors.warning }]}>
            <Text style={[styles.syncBadgeText, { color: colors.white }]}>{syncStatus.pendingCount}</Text>
          </View>
        )}
        {syncStatus.isSyncing && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.syncing} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
  },
  syncBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  syncBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  syncing: {
    marginLeft: SPACING.xs,
  },
});