import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarChartProps {
  title: string;
  subtitle?: string;
  items: Record<string, number>;
  total: number;
  limit?: number;
  color?: string;
  isMobile?: boolean;
}

export function ProgressBarChart({
  title,
  subtitle,
  items,
  total,
  limit = 10,
  color = '#2563eb',
  isMobile = false,
}: ProgressBarChartProps) {
  const entries = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (entries.length === 0) {
    return (
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        <View style={styles.header}>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>{title}</Text>
        </View>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const maxCount = entries[0]?.[1] || 1;
  const remaining = Object.keys(items).length - limit;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.header}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.list}>
        {entries.map(([item, count], index) => {
          const percentage = ((count / total) * 100).toFixed(0);
          const barWidth = `${(count / maxCount) * 100}%`;

          return (
            <View key={item} style={styles.row}>
              <View style={styles.rowTop}>
                <View style={styles.labelContainer}>
                  <View style={[styles.rankBadge, { backgroundColor: `${color}15` }]}>
                    <Text style={[styles.rank, { color: color }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.label, isMobile && styles.labelMobile]} numberOfLines={1}>
                    {item}
                  </Text>
                </View>
                <View style={styles.stats}>
                  <Text style={[styles.count, isMobile && styles.countMobile]}>{count}</Text>
                  <Text style={styles.percentage}>({percentage}%)</Text>
                </View>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFilled, { width: barWidth, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>

      {remaining > 0 && (
        <Text style={styles.remaining}>+{remaining} more</Text>
      )}
    </View>
  );
}

// Consistent spacing scale matching Dashboard
const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: SPACING.md,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  containerMobile: {
    padding: SPACING.md,
    borderRadius: SPACING.sm,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: SPACING.xs / 2,
  },
  titleMobile: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: SPACING.xs / 2,
  },
  list: {
    gap: SPACING.md,
  },
  row: {
    gap: SPACING.xs,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 13,
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
  },
  labelMobile: {
    fontSize: 13,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  count: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  countMobile: {
    fontSize: 15,
  },
  percentage: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  barContainer: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFilled: {
    height: '100%',
    borderRadius: 3,
  },
  remaining: {
    fontSize: 13,
    color: '#64748b',
    marginTop: SPACING.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
});
