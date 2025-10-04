#!/usr/bin/env tsx

/**
 * Build script for creating a library distribution of speedscope
 * that can be consumed by other projects
 */

import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

const outdir = path.join(process.cwd(), 'dist', 'lib')

// Clean output directory
if (fs.existsSync(outdir)) {
  // Use rm -rf for cross-platform compatibility
  const {execSync} = require('child_process')
  execSync(`rm -rf "${outdir}"`)
}
fs.mkdirSync(outdir, {recursive: true})

console.log('Building speedscope library...')

// Common build options
const commonOptions: esbuild.BuildOptions = {
  bundle: true,
  platform: 'browser',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  sourcemap: true,
  target: ['es2015'],
}

async function buildLib() {
  // Build main index (CommonJS)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/index.tsx'],
    outfile: path.join(outdir, 'index.js'),
    format: 'cjs',
  })
  console.log('✓ Built CommonJS bundle')

  // Build main index (ESM)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/index.tsx'],
    outfile: path.join(outdir, 'index.esm.js'),
    format: 'esm',
  })
  console.log('✓ Built ESM bundle')

  // Build standalone component (CommonJS)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/standalone-flamegraph.tsx'],
    outfile: path.join(outdir, 'standalone.js'),
    format: 'cjs',
  })
  console.log('✓ Built standalone CommonJS bundle')

  // Build standalone component (ESM)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/standalone-flamegraph.tsx'],
    outfile: path.join(outdir, 'standalone.esm.js'),
    format: 'esm',
  })
  console.log('✓ Built standalone ESM bundle')

  // Copy CSS files
  const cssFiles = ['assets/reset.css', 'assets/source-code-pro.css']
  const assetsDir = path.join(outdir, 'assets')
  fs.mkdirSync(assetsDir, {recursive: true})

  for (const cssFile of cssFiles) {
    if (fs.existsSync(cssFile)) {
      fs.copyFileSync(cssFile, path.join(outdir, cssFile))
    }
  }

  // Copy font files
  const fontDir = 'assets/source-code-pro'
  if (fs.existsSync(fontDir)) {
    const fontOutDir = path.join(outdir, fontDir)
    fs.mkdirSync(fontOutDir, {recursive: true})

    const fontFiles = fs.readdirSync(fontDir)
    for (const file of fontFiles) {
      fs.copyFileSync(path.join(fontDir, file), path.join(fontOutDir, file))
    }
  }
  console.log('✓ Copied assets')

  console.log('\n✅ Library build complete!')
  console.log(`Output: ${outdir}`)
  console.log('\nTo use in another project:')
  console.log('  1. npm link (in this directory)')
  console.log('  2. npm link speedscope (in your project)')
  console.log('  3. import { StandaloneFlamegraph } from "speedscope"')
}

buildLib().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
