# React Native Demos Stats

An automated statistics system that extracts metadata from React Native animation demos and provides an interactive dashboard to explore the data.

## Overview

This project automatically:
- Syncs with the [demos repository](https://github.com/enzomanuelmangano/demos)
- Extracts metadata from 110+ animation examples using AST parsing
- Generates aggregate statistics
- Provides an interactive web dashboard for filtering and exploring animations

## Features

### Automated Extraction
- **Static Analysis**: Uses TypeScript AST parsing (no AI)
- **Comprehensive Metadata**: Packages, hooks, functions, components
- **Pattern Detection**: Identifies animation patterns and techniques
- **Hash Tracking**: Detects changes in animation code

### Daily Updates
- GitHub Actions workflow runs daily at 2 AM UTC
- Automatically syncs latest demos
- Commits updated metadata to this repository

### Interactive Dashboard
- Filter animations by packages, hooks, patterns, techniques
- Search functionality
- Statistics overview
- Direct links to source code

## Project Structure

```
demos-stats/
├── .github/workflows/
│   └── daily-sync.yml          # GitHub Actions scheduler
├── scripts/
│   ├── sync-demos.js           # Clone/update demos repo
│   ├── extract-metadata.js     # Extract metadata from animations
│   └── meta-stats.js           # Generate aggregate stats
├── data/
│   ├── meta/                   # JSON metadata per animation
│   └── stats.json              # Aggregate statistics
├── src/
│   ├── components/             # Dashboard UI components
│   ├── hooks/                  # Data fetching hooks
│   ├── screens/                # Dashboard screens
│   └── types/                  # TypeScript types
└── App.tsx                     # Main dashboard app
```

## Getting Started

### Installation

```bash
# Install dependencies
bun install
```

### Extract Metadata

```bash
# Sync demos repo and extract all animations
npm run extract

# Extract single animation
npm run extract:single everybody-can-cook

# Generate aggregate statistics
npm run stats
```

### Run Dashboard

```bash
# Start web dashboard
npm run web

# Build for production
npm run build:web
```

## Scripts

- `npm run sync` - Clone/update the demos repository
- `npm run extract` - Extract metadata for all animations
- `npm run extract:single <slug>` - Extract single animation
- `npm run stats` - Generate aggregate statistics
- `npm run web` - Start web dashboard
- `npm run build:web` - Build dashboard for production

## Data Schema

### Animation Metadata (`data/meta/{slug}.json`)

```json
{
  "animation_slug": "everybody-can-cook",
  "content_hash": "...",
  "extracted_at": "2025-10-31T20:05:49.996Z",
  "packages": ["react", "react-native-reanimated", ...],
  "hooks": ["useSharedValue", "useAnimatedStyle", ...],
  "functions": ["withTiming", "withSpring", ...],
  "components": ["Animated.View", ...],
  "patterns": ["spring-animation", "gesture-animation", ...],
  "techniques": ["transform-animations", ...],
  "stats": {
    "total_files": 3,
    "total_packages": 4,
    "total_hooks": 5
  }
}
```

### Aggregate Stats (`data/stats.json`)

```json
{
  "total_animations": 110,
  "generated_at": "2025-10-31T...",
  "packages": {
    "react-native": 109,
    "react-native-reanimated": 109,
    ...
  },
  "hooks": {
    "useSharedValue": 94,
    "useAnimatedStyle": 89,
    ...
  }
}
```

## GitHub Actions Workflow

The workflow automatically:
1. Runs daily at 2 AM UTC (or manually via workflow_dispatch)
2. Syncs the demos repository
3. Extracts metadata from all animations
4. Generates aggregate statistics
5. Commits changes if data has updated

## Technologies

- **Expo** - React Native for web
- **TypeScript** - Type safety
- **simple-git** - Git operations
- **TypeScript Compiler API** - AST parsing
- **GitHub Actions** - Automated scheduling

## Contributing

This is an automated analytics system. The metadata is generated automatically from the source repository.

## License

MIT

## Credits

Animations source: [enzomanuelmangano/demos](https://github.com/enzomanuelmangano/demos)
