import {createRoot} from 'react-dom/client'
import {ApplicationContainer} from './views/application-container'
import {ThemeProvider} from './views/themes/theme'

console.log(`speedscope v${require('../package.json').version}`)

/*
TODO(jlfwong): Fix this
declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    // Force the old component go through teardown steps
    root.unmount()
  })
  module.hot.accept()
}
*/

const root = createRoot(document.body)
root.render(
  <ThemeProvider>
    <ApplicationContainer />
  </ThemeProvider>,
)
