#!/usr/bin/env node

/**
 * Generate Aggregate Statistics
 *
 * Analyzes all metadata files and generates aggregate statistics
 * for the dashboard.
 */

const fs = require('fs');
const path = require('path');

const META_DIR = path.join(__dirname, '..', 'data', 'meta');
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function generateStats() {
  console.log(`${colors.bright}Generating Aggregate Statistics${colors.reset}\n`);

  if (!fs.existsSync(META_DIR)) {
    console.error('Meta directory not found. Run extract-metadata.js first.');
    return;
  }

  const metaFiles = fs.readdirSync(META_DIR).filter(f => f.endsWith('.json'));

  console.log(`${colors.gray}Found ${metaFiles.length} animation metadata files${colors.reset}`);

  const stats = {
    total_animations: metaFiles.length,
    generated_at: new Date().toISOString(),
    packages: {},
    hooks: {},
    functions: {},
    components: {},
    patterns: {},
    techniques: {},
    // Reverse indexes for filtering
    packages_index: {},
    hooks_index: {},
    patterns_index: {},
    techniques_index: {},
    animations: [],
  };

  metaFiles.forEach(file => {
    const filePath = path.join(META_DIR, file);
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Track animation summary with full metadata for filtering
    stats.animations.push({
      slug: metadata.animation_slug,
      total_files: metadata.stats.total_files,
      total_packages: metadata.stats.total_packages,
      total_hooks: metadata.stats.total_hooks,
      total_patterns: metadata.stats.total_patterns,
      extracted_at: metadata.extracted_at,
      packages: metadata.packages,
      hooks: metadata.hooks,
      patterns: metadata.patterns,
      techniques: metadata.techniques,
      components: metadata.components,
      functions: metadata.functions,
    });

    // Count packages and build reverse index
    metadata.packages.forEach(pkg => {
      stats.packages[pkg] = (stats.packages[pkg] || 0) + 1;
      if (!stats.packages_index[pkg]) {
        stats.packages_index[pkg] = [];
      }
      stats.packages_index[pkg].push(metadata.animation_slug);
    });

    // Count hooks and build reverse index
    metadata.hooks.forEach(hook => {
      stats.hooks[hook] = (stats.hooks[hook] || 0) + 1;
      if (!stats.hooks_index[hook]) {
        stats.hooks_index[hook] = [];
      }
      stats.hooks_index[hook].push(metadata.animation_slug);
    });

    // Count functions
    metadata.functions.forEach(fn => {
      stats.functions[fn] = (stats.functions[fn] || 0) + 1;
    });

    // Count components
    metadata.components.forEach(comp => {
      stats.components[comp] = (stats.components[comp] || 0) + 1;
    });

    // Count patterns and build reverse index
    metadata.patterns.forEach(pattern => {
      stats.patterns[pattern] = (stats.patterns[pattern] || 0) + 1;
      if (!stats.patterns_index[pattern]) {
        stats.patterns_index[pattern] = [];
      }
      stats.patterns_index[pattern].push(metadata.animation_slug);
    });

    // Count techniques and build reverse index
    metadata.techniques.forEach(technique => {
      stats.techniques[technique] = (stats.techniques[technique] || 0) + 1;
      if (!stats.techniques_index[technique]) {
        stats.techniques_index[technique] = [];
      }
      stats.techniques_index[technique].push(metadata.animation_slug);
    });
  });

  // Sort by frequency
  stats.packages = Object.fromEntries(
    Object.entries(stats.packages).sort((a, b) => b[1] - a[1])
  );
  stats.hooks = Object.fromEntries(
    Object.entries(stats.hooks).sort((a, b) => b[1] - a[1])
  );
  stats.functions = Object.fromEntries(
    Object.entries(stats.functions).sort((a, b) => b[1] - a[1])
  );
  stats.components = Object.fromEntries(
    Object.entries(stats.components).sort((a, b) => b[1] - a[1])
  );
  stats.patterns = Object.fromEntries(
    Object.entries(stats.patterns).sort((a, b) => b[1] - a[1])
  );
  stats.techniques = Object.fromEntries(
    Object.entries(stats.techniques).sort((a, b) => b[1] - a[1])
  );

  // Top items
  const top = (obj, n = 10) => Object.entries(obj).slice(0, n);

  console.log(`\n${colors.bright}Top 10 Most Used:${colors.reset}`);
  console.log(`\n${colors.cyan}Packages:${colors.reset}`);
  top(stats.packages).forEach(([pkg, count]) => {
    console.log(`  ${pkg}: ${colors.green}${count}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}Hooks:${colors.reset}`);
  top(stats.hooks).forEach(([hook, count]) => {
    console.log(`  ${hook}: ${colors.green}${count}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}Patterns:${colors.reset}`);
  top(stats.patterns).forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${colors.green}${count}${colors.reset}`);
  });

  // Write stats file
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2) + '\n', 'utf8');

  console.log(`\n${colors.green}✓${colors.reset} Stats generated: ${STATS_FILE}`);
}

// Run if called directly
if (require.main === module) {
  generateStats();
}

module.exports = { generateStats };
