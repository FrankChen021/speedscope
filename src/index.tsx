// Main export file for using speedscope as a library

// Export the main flamegraph components
export {ChronoFlamechartView, LeftHeavyFlamechartView} from './views/flamechart-view-container'
export type {FlamechartViewContainerProps} from './views/flamechart-view-container'

// Export the core flamechart view if someone wants more control
export {FlamechartView} from './views/flamechart-view'
export type {FlamechartViewProps} from './views/flamechart-view-container'

// Export theme provider for styling
export {ThemeProvider, useTheme} from './views/themes/theme'
export type {Theme} from './views/themes/theme'
export {lightTheme} from './views/themes/light-theme'
export {darkTheme} from './views/themes/dark-theme'

// Export profile types and utilities
export type {Profile, ProfileGroup, Frame, CallTreeNode} from './lib/profile'
export {
  importProfileGroupFromText,
  importProfilesFromArrayBuffer,
  importProfileGroupFromBase64,
} from './import'

// Export canvas context for GL rendering
export {getCanvasContext} from './app-state/getters'
export type {CanvasContext} from './gl/canvas-context'

// Export ProfileSearchContextProvider for search functionality
export {ProfileSearchContextProvider} from './views/search-view'
