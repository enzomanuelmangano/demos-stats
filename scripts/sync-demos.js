#!/usr/bin/env node

/**
 * Sync Demos Repository
 *
 * Clones or updates the demos repository to a temporary location
 * for metadata extraction.
 */

const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

const DEMOS_REPO_URL = 'https://github.com/enzomanuelmangano/demos.git';
const TEMP_DIR = path.join(__dirname, '..', '.tmp');
const DEMOS_DIR = path.join(TEMP_DIR, 'demos');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

async function syncDemos() {
  console.log(`${colors.bright}Syncing Demos Repository${colors.reset}\n`);

  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const git = simpleGit();

    if (fs.existsSync(DEMOS_DIR)) {
      console.log(`${colors.cyan}→${colors.reset} Updating existing repository...`);

      const repoGit = simpleGit(DEMOS_DIR);
      await repoGit.fetch();
      await repoGit.pull('origin', 'main');

      console.log(`${colors.green}✓${colors.reset} Repository updated successfully`);
    } else {
      console.log(`${colors.cyan}→${colors.reset} Cloning repository...`);

      await git.clone(DEMOS_REPO_URL, DEMOS_DIR);

      console.log(`${colors.green}✓${colors.reset} Repository cloned successfully`);
    }

    console.log(`${colors.gray}Location: ${DEMOS_DIR}${colors.reset}`);

    return DEMOS_DIR;
  } catch (error) {
    console.error(`${colors.yellow}✗${colors.reset} Error syncing repository: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncDemos();
}

module.exports = { syncDemos, DEMOS_DIR };
