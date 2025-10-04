#!/usr/bin/env node

/**
 * Copy TypeScript declaration files to the lib directory
 */

const fs = require('fs')
const path = require('path')

const typesDir = path.join(process.cwd(), 'dist', 'lib', 'types', 'src')
const libDir = path.join(process.cwd(), 'dist', 'lib')

function copyTypes() {
  if (!fs.existsSync(typesDir)) {
    console.error('Types directory not found:', typesDir)
    process.exit(1)
  }

  // Copy index.d.ts
  const indexTypes = path.join(typesDir, 'index.d.ts')
  if (fs.existsSync(indexTypes)) {
    fs.copyFileSync(indexTypes, path.join(libDir, 'index.d.ts'))
    console.log('✓ Copied index.d.ts')
  }

  // Copy standalone-flamegraph.d.ts
  const standaloneTypes = path.join(typesDir, 'standalone-flamegraph.d.ts')
  if (fs.existsSync(standaloneTypes)) {
    fs.copyFileSync(standaloneTypes, path.join(libDir, 'standalone.d.ts'))
    console.log('✓ Copied standalone.d.ts')
  }

  console.log('✅ Type definitions copied successfully')
}

copyTypes()
