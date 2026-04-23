import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Club Bar' }: HeaderProps) {
  const { isOnline, syncStatus } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.secondary : COLORS.danger }]} />
        <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        {syncStatus.pendingCount > 0 && (
          <View style={styles.syncBadge}>
            <Text style={styles.syncBadgeText}>{syncStatus.pendingCount}</Text>
          </View>
        )}
        {syncStatus.isSyncing && (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.syncing} />
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
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.textSecondary,
  },
  syncBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  syncBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  syncing: {
    marginLeft: SPACING.xs,
  },
});
