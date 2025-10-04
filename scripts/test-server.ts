import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const outdir = 'dist/test'

  // Create output directory
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, {recursive: true})
  }

  let ctx = await esbuild.context({
    entryPoints: ['src/test-standalone.tsx'],
    outdir,
    bundle: true,
    format: 'esm',
    sourcemap: true,
    loader: {
      '.woff2': 'file',
      '.png': 'file',
      '.ico': 'file',
    },
    plugins: [
      {
        name: 'generate-test-html',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length > 0) return

            // Generate simple index.html
            const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>StandaloneFlamegraph Test</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }
    </style>
  </head>
  <body>
    <script type="module" src="./test-standalone.js"></script>
  </body>
</html>`

            fs.writeFileSync(path.join(outdir, 'index.html'), html)
            console.log('✓ Generated test page')
          })
        },
      },
    ],
  })

  await ctx.rebuild()

  let {host, port} = await ctx.serve({
    servedir: outdir,
  })

  console.log(`Test server is running at http://${host}:${port}`)
  console.log('Press Ctrl+C to stop')
}

main().catch(err => {
  console.error('Error starting test server:', err)
  process.exit(1)
})
