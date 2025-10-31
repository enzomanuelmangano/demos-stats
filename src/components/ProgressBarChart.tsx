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
    marginBottom: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  rank: {
    fontSize: 14,
    color: '#666',
    width: 32,
    fontFamily: 'monospace',
  },
  count: {
    fontSize: 14,
    color: '#fff',
    width: 40,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  percentage: {
    fontSize: 14,
    color: '#888',
    width: 70,
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  barContainer: {
    flex: 1,
    height: 16,
    position: 'relative',
    marginHorizontal: 8,
  },
  barFilled: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 2,
  },
  barEmpty: {
    height: '100%',
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    width: 180,
    fontFamily: 'monospace',
  },
  remaining: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'monospace',
    marginLeft: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
});
