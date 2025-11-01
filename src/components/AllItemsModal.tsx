import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { PressableOpacity, PressableWithoutFeedback } from 'pressto';

interface AllItemsModalProps {
  visible: boolean;
  onClose: () => void;
  items: Record<string, number>;
  title: string;
  color: string;
  total: number;
  onItemPress?: (item: string) => void;
}

const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export function AllItemsModal({
  visible,
  onClose,
  items,
  title,
  color,
  total,
  onItemPress,
}: AllItemsModalProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <PressableWithoutFeedback style={styles.overlay} onPress={onClose}>
        <PressableWithoutFeedback
          style={[
            styles.modalContainer,
            isMobile && styles.modalContainerMobile,
            { maxHeight: height * 0.85 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
                <View style={[styles.badgeDot, { backgroundColor: color }]} />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, isMobile && styles.titleMobile]}>
                  {title}
                </Text>
              </View>
            </View>
            <PressableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </PressableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              <Text style={styles.statsCount}>{entries.length}</Text> items total
            </Text>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.list}>
              {entries.map(([item, count], index) => {
                const percentage = ((count / total) * 100).toFixed(0);

                const content = (
                  <View style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemLeft}>
                        <View style={[styles.rankBadge, { backgroundColor: `${color}15` }]}>
                          <Text style={[styles.rank, { color: color }]}>{index + 1}</Text>
                        </View>
                        <Text
                          style={[
                            styles.itemName,
                            isMobile && styles.itemNameMobile,
                          ]}
                          numberOfLines={1}
                        >
                          {item}
                        </Text>
                      </View>
                      <View style={styles.itemStats}>
                        <Text style={[styles.count, isMobile && styles.countMobile]}>
                          {count}
                        </Text>
                        <Text style={styles.percentage}>({percentage}%)</Text>
                      </View>
                    </View>
                  </View>
                );

                if (onItemPress) {
                  return (
                    <PressableOpacity
                      key={item}
                      onPress={() => onItemPress(item)}
                    >
                      {content}
                    </PressableOpacity>
                  );
                }

                return <View key={item}>{content}</View>;
              })}
            </View>
          </ScrollView>
        </PressableWithoutFeedback>
      </PressableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: SPACING.lg,
    width: '100%',
    maxWidth: 600,
    overflow: 'hidden',
  },
  modalContainerMobile: {
    maxWidth: '100%',
    borderRadius: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  titleMobile: {
    fontSize: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '600',
  },
  stats: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: '#f8fafc',
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
  },
  statsCount: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 16,
  },
  scrollView: {
    maxHeight: 500,
  },
  list: {
    padding: SPACING.xl,
    gap: SPACING.xs,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
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
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  itemNameMobile: {
    fontSize: 14,
  },
  itemStats: {
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
});
