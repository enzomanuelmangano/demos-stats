import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
} from 'react-native';

interface Animation {
  slug: string;
  packages: string[];
  hooks: string[];
  functions: string[];
  components: string[];
  patterns: string[];
  techniques: string[];
}

interface AnimationListModalProps {
  visible: boolean;
  onClose: () => void;
  animations: Animation[];
  itemName: string;
  categoryName: string;
  color: string;
}

const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export function AnimationListModal({
  visible,
  onClose,
  animations,
  itemName,
  categoryName,
  color,
}: AnimationListModalProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  const openAnimation = (slug: string) => {
    const url = `https://github.com/enzomanuelmangano/demos/tree/main/src/animations/${slug}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
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
                <Text style={styles.categoryLabel}>{categoryName}</Text>
                <Text style={[styles.itemName, isMobile && styles.itemNameMobile]}>
                  {itemName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              <Text style={styles.statsCount}>{animations.length}</Text> animation
              {animations.length !== 1 ? 's' : ''} using this {categoryName.toLowerCase()}
            </Text>
          </View>

          {/* Animation List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {animations.map((anim) => (
                <TouchableOpacity
                  key={anim.slug}
                  style={styles.animationCard}
                  onPress={() => openAnimation(anim.slug)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.animationName, isMobile && styles.animationNameMobile]}>
                      {anim.slug.split('-').join(' ')}
                    </Text>
                    <Text style={styles.linkIcon}>→</Text>
                  </View>
                  <View style={styles.tags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {anim.components?.length || 0} components
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {anim.hooks?.length || 0} hooks
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {anim.functions?.length || 0} functions
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
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
  categoryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs / 2,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemNameMobile: {
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
    gap: SPACING.sm,
  },
  animationCard: {
    backgroundColor: '#ffffff',
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  animationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
    flex: 1,
  },
  animationNameMobile: {
    fontSize: 15,
  },
  linkIcon: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs / 2,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
});
