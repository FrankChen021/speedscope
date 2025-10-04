# Quick NPM Publishing Guide

## TL;DR - Publish in 2 Steps

```bash
# 1. Login to npm (first time only)
npm login

# 2. Publish (for scoped packages like @frankchen029/speedscope)
# Note: prepublishOnly hook will automatically run typecheck and build:lib
npm publish --access public
```

**Optional - Test with dry-run first:**

```bash
# See what will be published without actually publishing
npm publish --dry-run --access public
```

## Before Publishing

1. **Update version** (if needed):

   ```bash
   npm version patch  # or minor/major
   ```

2. **Verify build works**:

   ```bash
   npm run typecheck  # Check for TypeScript errors
   npm run build:lib  # Build the library
   ```

3. **Check what will be published**:
   ```bash
   # The package will include:
   # - dist/lib/**/* (all built files)
   # - bin/cli.mjs (CLI tool)
   # - README.md
   # - LICENSE
   ```

## After Publishing

Test the package in another project:

```bash
# In a test project
npm install @frankchen029/speedscope
```

```tsx
// Use it
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function App() {
  return <StandaloneFlamegraph profileData={data} width={800} height={600} />
}
```

## Package Details

- **Name**: `@frankchen029/speedscope`
- **Current Version**: 1.23.1
- **Main Export**: `dist/lib/index.js` (CommonJS)
- **Module Export**: `dist/lib/index.esm.js` (ESM)
- **Types**: `dist/lib/index.d.ts`
- **Peer Dependencies**: React ≥16.8.0, ReactDOM ≥16.8.0

## Troubleshooting

### "You need to login first"

```bash
npm login
```

### "Cannot publish over existing version"

```bash
npm version patch  # Bump version first
npm publish --access public
```

### "Package name too similar"

Use a scoped package name: `@your-username/speedscope`

### Build errors

```bash
npm install  # Reinstall dependencies
npm run typecheck  # Check for errors
npm run build:lib  # Build again
```

## Full Documentation

See [NPM_PUBLISHING_GUIDE.md](./NPM_PUBLISHING_GUIDE.md) for comprehensive documentation.
