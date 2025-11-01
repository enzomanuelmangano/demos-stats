import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { PressableOpacity } from 'pressto';
import { useAggregateStats } from '../hooks/useAnalytics';
import { ProgressBarChart } from '../components/ProgressBarChart';
import { AnimationListModal } from '../components/AnimationListModal';
import { AllItemsModal } from '../components/AllItemsModal';

/**
 * Normalize component names by stripping common prefixes
 * - Touchable.Canvas -> Canvas
 * - Animated.View -> View
 * - Other.Namespaced.Component -> Component (last part)
 */
function normalizeComponentName(component: string): string {
  // Strip Touchable. prefix
  if (component.startsWith('Touchable.')) {
    return component.substring('Touchable.'.length);
  }
  // Strip Animated. prefix
  if (component.startsWith('Animated.')) {
    return component.substring('Animated.'.length);
  }
  // For other cases with dots, take the last part
  if (component.includes('.')) {
    const parts = component.split('.');
    return parts[parts.length - 1];
  }
  return component;
}

type CategoryType =
  | 'components'
  | 'functions'
  | 'packages'
  | 'hooks'
  | 'patterns'
  | 'techniques';

export function Dashboard() {
  const { stats, loading, error } = useAggregateStats();
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType>('components');

  // All Items Modal state
  const [allItemsModalVisible, setAllItemsModalVisible] = useState(false);
  const [allItemsCategory, setAllItemsCategory] =
    useState<CategoryType>('components');

  const filteredAnimations = useMemo(() => {
    if (!stats) return [];

    let filtered = stats.animations;

    // Package filter - animation must have ANY selected package (OR logic)
    if (selectedPackages.length > 0) {
      filtered = filtered.filter((anim) =>
        selectedPackages.some((pkg) => anim.packages.includes(pkg))
      );
    }

    return filtered;
  }, [stats, selectedPackages]);

  // Calculate insights from filtered animations
  const insights = useMemo(() => {
    if (!stats) {
      return {
        patterns: {},
        techniques: {},
        components: {},
        hooks: {},
        packages: {},
        functions: {},
      };
    }

    // If exactly one package is selected, show package-specific data IF available
    const singlePackageFilter =
      selectedPackages.length === 1 ? selectedPackages[0] : null;

    // Check if this package has detailed tracking data
    const hasPackageDetail =
      singlePackageFilter &&
      stats.components_by_package?.[singlePackageFilter] &&
      Object.keys(stats.components_by_package[singlePackageFilter]).length > 0;

    if (hasPackageDetail && singlePackageFilter) {
      // Get the package-specific items from the global stats
      const packageComponents =
        stats.components_by_package[singlePackageFilter] || {};
      const packageHooks = stats.hooks_by_package[singlePackageFilter] || {};
      const packageFunctions =
        stats.functions_by_package[singlePackageFilter] || {};

      // Now count only these items in the filtered animations
      const components: Record<string, number> = {};
      const hooks: Record<string, number> = {};
      const functions: Record<string, number> = {};

      // Count occurrences in filtered animations only
      filteredAnimations.forEach((anim) => {
        // Use packages_detail from this specific animation to know which components are from which package
        const animPackageDetail = (anim as any).packages_detail?.[
          singlePackageFilter
        ];

        if (animPackageDetail) {
          // Count components FROM this package in this specific animation
          // If components array is empty, use imports
          const uniqueComponents = new Set<string>();
          const componentsList =
            animPackageDetail.components &&
            animPackageDetail.components.length > 0
              ? animPackageDetail.components
              : animPackageDetail.imports || [];

          if (componentsList.length > 0) {
            componentsList.forEach((component: string) => {
              const baseComponent = normalizeComponentName(component);
              uniqueComponents.add(baseComponent);
            });
          }

          // Also check for Touchable.* and Animated.* wrapped versions in global components
          // For Skia specifically, check if global components has Touchable.Canvas, Touchable.Circle, etc.
          if (singlePackageFilter === '@shopify/react-native-skia') {
            const skiaComponents = [
              'Canvas',
              'Circle',
              'Group',
              'Path',
              'Rect',
              'Image',
              'Text',
              'Blur',
            ];
            anim.components.forEach((comp: string) => {
              if (
                comp.startsWith('Touchable.') ||
                comp.startsWith('Animated.')
              ) {
                const normalized = normalizeComponentName(comp);
                // Only add if it's a known Skia component and not already counted
                if (
                  skiaComponents.includes(normalized) &&
                  !uniqueComponents.has(normalized)
                ) {
                  uniqueComponents.add(normalized);
                }
              }
            });

            // Handle third-party packages built on Skia (e.g., react-native-qrcode-skia)
            if (anim.packages.includes('react-native-qrcode-skia')) {
              // react-native-qrcode-skia is built on Canvas and Path
              if (!uniqueComponents.has('Canvas')) {
                uniqueComponents.add('Canvas');
              }
              if (!uniqueComponents.has('Path')) {
                uniqueComponents.add('Path');
              }
            }
          }

          uniqueComponents.forEach((comp) => {
            components[comp] = (components[comp] || 0) + 1;
          });

          // Count hooks FROM this package in this specific animation
          if (animPackageDetail.hooks) {
            animPackageDetail.hooks.forEach((hook: string) => {
              hooks[hook] = (hooks[hook] || 0) + 1;
            });
          }

          // Count functions FROM this package in this specific animation
          if (animPackageDetail.functions) {
            animPackageDetail.functions.forEach((fn: string) => {
              functions[fn] = (functions[fn] || 0) + 1;
            });
          }
        }
      });

      // Still compute patterns and techniques normally (not package-specific)
      const patterns: Record<string, number> = {};
      const techniques: Record<string, number> = {};
      const packages: Record<string, number> = {};

      filteredAnimations.forEach((anim) => {
        anim.patterns.forEach((pattern) => {
          patterns[pattern] = (patterns[pattern] || 0) + 1;
        });
        anim.techniques.forEach((technique) => {
          techniques[technique] = (techniques[technique] || 0) + 1;
        });
        anim.packages.forEach((pkg) => {
          packages[pkg] = (packages[pkg] || 0) + 1;
        });
      });

      return { patterns, techniques, components, hooks, packages, functions };
    }

    // Default: calculate from all filtered animations
    const patterns: Record<string, number> = {};
    const techniques: Record<string, number> = {};
    const components: Record<string, number> = {};
    const hooks: Record<string, number> = {};
    const packages: Record<string, number> = {};
    const functions: Record<string, number> = {};

    filteredAnimations.forEach((anim) => {
      // Count patterns
      anim.patterns.forEach((pattern) => {
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      });

      // Count techniques
      anim.techniques.forEach((technique) => {
        techniques[technique] = (techniques[technique] || 0) + 1;
      });

      // Count components with normalization (unique per animation)
      const uniqueComponents = new Set<string>();
      anim.components.forEach((component) => {
        const baseComponent = normalizeComponentName(component);
        uniqueComponents.add(baseComponent);
      });

      // Increment count for each unique component
      uniqueComponents.forEach((comp) => {
        components[comp] = (components[comp] || 0) + 1;
      });

      // Count hooks (for insight, not filtering)
      anim.hooks.forEach((hook) => {
        hooks[hook] = (hooks[hook] || 0) + 1;
      });

      // Count packages (for insight)
      anim.packages.forEach((pkg) => {
        packages[pkg] = (packages[pkg] || 0) + 1;
      });

      // Count functions
      anim.functions.forEach((fn) => {
        functions[fn] = (functions[fn] || 0) + 1;
      });
    });

    return { patterns, techniques, components, hooks, packages, functions };
  }, [filteredAnimations, selectedPackages, stats]);

  const toggleFilter = (
    list: string[],
    item: string,
    setter: (items: string[]) => void
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const clearAllFilters = () => {
    setSelectedPackages([]);
  };

  const totalActiveFilters = selectedPackages.length;

  // Get animations for selected item in modal
  const modalAnimations = useMemo(() => {
    if (!stats || !selectedItem) return [];

    return filteredAnimations.filter((anim) => {
      switch (selectedCategory) {
        case 'components':
          return anim.components.includes(selectedItem);
        case 'functions':
          return anim.functions.includes(selectedItem);
        case 'packages':
          return anim.packages.includes(selectedItem);
        case 'hooks':
          return anim.hooks.includes(selectedItem);
        case 'patterns':
          return anim.patterns.includes(selectedItem);
        case 'techniques':
          return anim.techniques.includes(selectedItem);
        default:
          return false;
      }
    });
  }, [stats, filteredAnimations, selectedItem, selectedCategory]);

  const handleItemPress = (item: string, category: CategoryType) => {
    setSelectedItem(item);
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleShowAllPress = (category: CategoryType) => {
    setAllItemsCategory(category);
    setAllItemsModalVisible(true);
  };

  const getCategoryDisplayName = (category: CategoryType): string => {
    const names: Record<CategoryType, string> = {
      components: 'Component',
      functions: 'Function',
      packages: 'Package',
      hooks: 'Hook',
      patterns: 'Pattern',
      techniques: 'Technique',
    };
    return names[category];
  };

  const getCategoryColor = (category: CategoryType): string => {
    const colors: Record<CategoryType, string> = {
      components: '#6366f1',
      functions: '#f59e0b',
      packages: '#059669',
      hooks: '#dc2626',
      patterns: '#0891b2',
      techniques: '#ea580c',
    };
    return colors[category];
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Failed to load analytics data'}
        </Text>
        <Text style={styles.errorHint}>
          Run `npm run extract` to generate analytics data
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
    >
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <Text
          style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}
        >
          Demos Stats
        </Text>
        <View style={styles.headerSubtitleContainer}>
          <Text style={styles.headerSubtitle}>Automated stats for </Text>
          <PressableOpacity
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open(
                  'https://github.com/enzomanuelmangano/demos',
                  '_blank'
                );
              }
            }}
            style={styles.demoLink}
          >
            <Text style={styles.demoLinkText}>Demos</Text>
          </PressableOpacity>
        </View>

        <View
          style={[styles.statsOverview, isMobile && styles.statsOverviewMobile]}
        >
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={styles.statValue}>{filteredAnimations.length}</Text>
            <Text style={styles.statLabel}>Animations</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={styles.statValue}>
              {Object.keys(insights.patterns).length}
            </Text>
            <Text style={styles.statLabel}>Patterns</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={styles.statValue}>
              {Object.keys(insights.components).length}
            </Text>
            <Text style={styles.statLabel}>Components</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View
        style={[styles.filterSection, isMobile && styles.filterSectionMobile]}
      >
        <View style={styles.filterHeader}>
          <View>
            <Text style={styles.filterHeaderTitle}>Filter by Package</Text>
            <Text style={styles.filterHeaderSubtitle}>
              {totalActiveFilters === 0
                ? 'Select packages to filter'
                : `${totalActiveFilters} selected`}
            </Text>
          </View>
          {totalActiveFilters > 0 && (
            <PressableOpacity
              onPress={clearAllFilters}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear all</Text>
            </PressableOpacity>
          )}
        </View>

        <View
          style={[
            styles.filterChipsWrapper,
            isMobile && styles.filterChipsWrapperMobile,
          ]}
        >
          {Object.entries(stats.packages)
            .sort((a, b) => b[1] - a[1])
            .map(([pkg, count]) => {
              const isSelected = selectedPackages.includes(pkg);
              return (
                <PressableOpacity
                  key={pkg}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() =>
                    toggleFilter(selectedPackages, pkg, setSelectedPackages)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {pkg}
                  </Text>
                  <View
                    style={[
                      styles.chipBadge,
                      isSelected && styles.chipBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipCount,
                        isSelected && styles.chipCountSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </PressableOpacity>
              );
            })}
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <View
          style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}
        >
          <View>
            <Text
              style={[
                styles.sectionTitle,
                isMobile && styles.sectionTitleMobile,
              ]}
            >
              Analysis Results
            </Text>
            <Text style={styles.sectionSubtitle}>
              Top patterns and usage statistics
            </Text>
          </View>
          <View style={styles.matchedBadge}>
            <Text style={styles.matchedCount}>{filteredAnimations.length}</Text>
            <Text style={styles.matchedLabel}>results</Text>
          </View>
        </View>

        <View style={[styles.chartsGrid, isMobile && styles.chartsGridMobile]}>
          <ProgressBarChart
            title="Components"
            items={insights.components}
            total={filteredAnimations.length}
            color="#6366f1"
            limit={isMobile ? 5 : 8}
            isMobile={isMobile}
            onItemPress={(item) => handleItemPress(item, 'components')}
            onShowAllPress={() => handleShowAllPress('components')}
          />

          <ProgressBarChart
            title="Functions"
            items={insights.functions}
            total={filteredAnimations.length}
            color="#f59e0b"
            limit={isMobile ? 5 : 8}
            isMobile={isMobile}
            onItemPress={(item) => handleItemPress(item, 'functions')}
            onShowAllPress={() => handleShowAllPress('functions')}
          />

          <ProgressBarChart
            title="Packages"
            items={insights.packages}
            total={filteredAnimations.length}
            color="#059669"
            limit={isMobile ? 5 : 8}
            isMobile={isMobile}
            onItemPress={(item) => handleItemPress(item, 'packages')}
            onShowAllPress={() => handleShowAllPress('packages')}
          />

          <ProgressBarChart
            title="Hooks"
            items={insights.hooks}
            total={filteredAnimations.length}
            color="#dc2626"
            limit={isMobile ? 5 : 8}
            isMobile={isMobile}
            onItemPress={(item) => handleItemPress(item, 'hooks')}
            onShowAllPress={() => handleShowAllPress('hooks')}
          />

          <ProgressBarChart
            title="Patterns"
            items={insights.patterns}
            total={filteredAnimations.length}
            color="#0891b2"
            limit={isMobile ? 5 : 8}
            isMobile={isMobile}
            onItemPress={(item) => handleItemPress(item, 'patterns')}
            onShowAllPress={() => handleShowAllPress('patterns')}
          />

          <ProgressBarChart
            title="Techniques"
            items={insights.techniques}
            total={filteredAnimations.length}
            color="#ea580c"
            limit={isMobile ? 5 : 8}
            isMobile={isMobile}
            onItemPress={(item) => handleItemPress(item, 'techniques')}
            onShowAllPress={() => handleShowAllPress('techniques')}
          />
        </View>
      </View>

      {/* Modals */}
      <AnimationListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        animations={modalAnimations}
        itemName={selectedItem}
        categoryName={getCategoryDisplayName(selectedCategory)}
        color={getCategoryColor(selectedCategory)}
      />

      <AllItemsModal
        visible={allItemsModalVisible}
        onClose={() => setAllItemsModalVisible(false)}
        items={insights[allItemsCategory]}
        title={getCategoryDisplayName(allItemsCategory) + 's'}
        color={getCategoryColor(allItemsCategory)}
        total={filteredAnimations.length}
        onItemPress={(item) => {
          setAllItemsModalVisible(false);
          handleItemPress(item, allItemsCategory);
        }}
      />
    </ScrollView>
  );
}

// Consistent spacing scale (scaled down for compact UI)
const SPACING = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  huge: 44,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  content: {
    padding: SPACING.xxl,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  contentMobile: {
    padding: SPACING.md,
    maxWidth: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 15,
    color: '#64748b',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },

  // Header
  header: {
    marginBottom: SPACING.huge,
  },
  headerMobile: {
    marginBottom: SPACING.xxl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: SPACING.xs,
    letterSpacing: -1,
    lineHeight: 38,
  },
  headerTitleMobile: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.xs / 2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  demoLink: {
    paddingVertical: 2,
  },
  demoLinkText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
    lineHeight: 22,
  },
  authorLink: {
    paddingVertical: 2,
  },
  authorLinkText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 22,
  },
  statsOverview: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statsOverviewMobile: {
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardMobile: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: SPACING.xs / 2,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filters
  filterSection: {
    marginBottom: SPACING.xxl,
    backgroundColor: '#ffffff',
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterSectionMobile: {
    padding: SPACING.md,
    borderRadius: SPACING.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  filterHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: SPACING.xs / 2,
  },
  filterHeaderSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  clearButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
  },
  clearButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterChipsWrapperMobile: {
    gap: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#f8fafc',
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
    paddingVertical: 8,
    borderRadius: SPACING.xs,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: SPACING.xs,
    minWidth: 28,
    alignItems: 'center',
  },
  chipBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipCount: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  chipCountSelected: {
    color: '#ffffff',
  },

  // Insights
  insightsSection: {
    marginBottom: SPACING.huge,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xxl,
  },
  sectionHeaderMobile: {
    flexDirection: 'column',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: SPACING.xs / 2,
  },
  sectionTitleMobile: {
    fontSize: 19,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#eff6ff',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  matchedCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb',
  },
  matchedLabel: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartsGrid: {
    gap: SPACING.lg,
  },
  chartsGridMobile: {
    gap: SPACING.md,
  },
});
