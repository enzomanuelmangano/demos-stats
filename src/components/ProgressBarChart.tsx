import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarChartProps {
  title: string;
  subtitle?: string;
  items: Record<string, number>;
  total: number;
  limit?: number;
  color?: string;
}

export function ProgressBarChart({
  title,
  subtitle,
  items,
  total,
  limit = 10,
  color = '#007AFF',
}: ProgressBarChartProps) {
  const entries = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.separator} />
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const remaining = Object.keys(items).length - limit;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.separator} />

      {entries.map(([item, count], index) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const barWidth = `${(count / total) * 100}%`;

        return (
          <View key={item} style={styles.row}>
            <Text style={styles.rank}>{index + 1}.</Text>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.percentage}>({percentage}%)</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFilled, { width: barWidth, backgroundColor: color }]} />
              <View style={styles.barEmpty} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {item}
            </Text>
          </View>
        );
      })}

      {remaining > 0 && (
        <Text style={styles.remaining}>... and {remaining} more</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rank: {
    fontSize: 12,
    color: '#555',
    width: 24,
    fontFamily: 'monospace',
  },
  count: {
    fontSize: 13,
    color: '#fff',
    width: 32,
    textAlign: 'right',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  percentage: {
    fontSize: 11,
    color: '#666',
    width: 50,
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  barContainer: {
    flex: 1,
    height: 6,
    position: 'relative',
    marginHorizontal: 8,
    backgroundColor: '#111',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFilled: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 3,
  },
  barEmpty: {
    display: 'none',
  },
  label: {
    fontSize: 13,
    color: '#ccc',
    minWidth: 120,
    fontFamily: 'monospace',
  },
  remaining: {
    fontSize: 12,
    color: '#555',
    marginTop: 8,
    fontFamily: 'monospace',
    marginLeft: 24,
  },
  emptyText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
});
