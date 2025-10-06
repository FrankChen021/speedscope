/**
 * Standalone Sandwich View Component
 *
 * Wraps the original SandwichView with necessary contexts for standalone use
 */

import {StyleSheet, css} from 'aphrodite'
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {
  flattenRecursionAtom,
  glCanvasAtom,
  profileGroupAtom,
  searchIsActiveAtom,
  searchQueryAtom,
} from './app-state'
import {ActiveProfileState} from './app-state/active-profile-state'
import {getCanvasContext} from './app-state/getters'
import {CanvasContext} from './gl/canvas-context'
import {importProfileGroupFromText, importProfilesFromArrayBuffer} from './import'
import {useAtom} from './lib/atom'
import {Rect, Vec2} from './lib/math'
import {CallTreeNode, Frame, Profile, ProfileGroup} from './lib/profile'
import {ProfileSearchResults} from './lib/profile-search'
import {SandwichViewContainer, SandwichViewContext} from './views/sandwich-view'
import {ProfileSearchContext} from './views/search-view'
import {FontFamily} from './views/style'
import {darkTheme} from './views/themes/dark-theme'
import {lightTheme} from './views/themes/light-theme'
import {ThemeContext, withTheme} from './views/themes/theme'

// Viewport configuration constants
const VIEWPORT_CONFIG = {
  // Maximum number of stack levels to show in viewport
  // Reducing this increases the height of each bar
  MAX_VISIBLE_DEPTH: 24,

  // Initial Y offset for inverted flamegraphs (callers)
  // Must match the minimum Y clamping in flamechart.ts for inverted views
  INVERTED_MIN_Y: 0,

  // Initial Y offset for non-inverted flamegraphs (callees)
  // Must match the minimum Y clamping in flamechart.ts for non-inverted views
  NON_INVERTED_MIN_Y: -1,
} as const

export interface StandaloneSandwichProps {
  profileData?: Profile | ProfileGroup | string | ArrayBuffer
  fileName?: string
  width?: string | number
  height?: string | number
  theme?: 'light' | 'dark'
  onProfileLoad?: (profile: Profile) => void
  onError?: (error: Error) => void
}

const getStyle = withTheme(theme =>
  StyleSheet.create({
    root: {
      position: 'relative',
      overflow: 'hidden',
      fontFamily: FontFamily.MONOSPACE,
      fontSize: '10px',
      lineHeight: '20px',
      color: theme.fgPrimaryColor,
      background: theme.bgPrimaryColor,
      display: 'flex',
      flexDirection: 'column',
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
    },
  }),
)

export function StandaloneSandwich({
  profileData,
  fileName = 'profile.json',
  width = '100%',
  height = '600px',
  theme = 'light',
  onProfileLoad,
  onError,
}: StandaloneSandwichProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [hoveredNodeCaller, setHoveredNodeCaller] = useState<{
    node: CallTreeNode
    event: MouseEvent
  } | null>(null)
  const [hoveredNodeCallee, setHoveredNodeCallee] = useState<{
    node: CallTreeNode
    event: MouseEvent
  } | null>(null)
  const glCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContextRef = useRef<CanvasContext | null>(null)

  // Use state instead of ref so changes trigger re-renders
  const [viewportStates, setViewportStates] = useState<{
    invertedCallerFlamegraph: {
      hover: any
      selectedNode: any
      configSpaceViewportRect: Rect
      logicalSpaceViewportSize: Vec2
    }
    calleeFlamegraph: {
      hover: any
      selectedNode: any
      configSpaceViewportRect: Rect
      logicalSpaceViewportSize: Vec2
    }
  } | null>(null)

  // Use search query and search active state from atoms
  const searchQuery = useAtom(searchQueryAtom)
  const searchIsActive = useAtom(searchIsActiveAtom)

  const forcedTheme = theme === 'light' ? lightTheme : darkTheme

  // Set global atoms for standalone mode
  useEffect(() => {
    flattenRecursionAtom.set(false) // Default: don't flatten recursion
  }, [])

  // Override profileGroupAtom methods to use our local state
  useEffect(() => {
    const originalSetSelectedFrame = profileGroupAtom.setSelectedFrame
    const originalSetConfigSpaceViewportRect = profileGroupAtom.setConfigSpaceViewportRect
    const originalSetLogicalSpaceViewportSize = profileGroupAtom.setLogicalSpaceViewportSize

    profileGroupAtom.setSelectedFrame = (frame: Frame | null) => {
      setSelectedFrame(frame)

      if (frame && profile) {
        const invertedCallerProfile = profile.getInvertedProfileForCallersOf(frame)
        const calleeProfile = profile.getProfileForCalleesOf(frame)

        const viewportHeight = VIEWPORT_CONFIG.MAX_VISIBLE_DEPTH / 2 + 1.0

        const invertedCallerViewport = new Rect(
          new Vec2(0, VIEWPORT_CONFIG.INVERTED_MIN_Y),
          new Vec2(invertedCallerProfile.getTotalNonIdleWeight(), viewportHeight),
        )
        const calleeViewport = new Rect(
          new Vec2(0, VIEWPORT_CONFIG.NON_INVERTED_MIN_Y),
          new Vec2(calleeProfile.getTotalWeight(), viewportHeight),
        )

        setViewportStates({
          invertedCallerFlamegraph: {
            hover: hoveredNodeCaller,
            selectedNode: null,
            configSpaceViewportRect: invertedCallerViewport,
            logicalSpaceViewportSize: Vec2.zero,
          },
          calleeFlamegraph: {
            hover: hoveredNodeCallee,
            selectedNode: null,
            configSpaceViewportRect: calleeViewport,
            logicalSpaceViewportSize: Vec2.zero,
          },
        })
      } else {
        setViewportStates(null)
      }
    }

    profileGroupAtom.setConfigSpaceViewportRect = (id: any, rect: Rect) => {
      setViewportStates(prev => {
        if (!prev) {
          return prev
        }
        // Update the appropriate flamegraph viewport based on id
        if (id === 'SANDWICH_INVERTED_CALLERS') {
          return {
            ...prev,
            invertedCallerFlamegraph: {
              ...prev.invertedCallerFlamegraph,
              configSpaceViewportRect: rect,
            },
          }
        } else if (id === 'SANDWICH_CALLEES') {
          return {
            ...prev,
            calleeFlamegraph: {
              ...prev.calleeFlamegraph,
              configSpaceViewportRect: rect,
            },
          }
        }
        return prev
      })
    }

    profileGroupAtom.setLogicalSpaceViewportSize = (id: any, size: Vec2) => {
      setViewportStates(prev => {
        if (!prev) return prev
        if (id === 'SANDWICH_INVERTED_CALLERS') {
          return {
            ...prev,
            invertedCallerFlamegraph: {
              ...prev.invertedCallerFlamegraph,
              logicalSpaceViewportSize: size,
            },
          }
        } else if (id === 'SANDWICH_CALLEES') {
          return {
            ...prev,
            calleeFlamegraph: {
              ...prev.calleeFlamegraph,
              logicalSpaceViewportSize: size,
            },
          }
        }
        return prev
      })
    }

    // Override setFlamechartHoveredNode to update our local hover states
    const originalSetFlamechartHoveredNode = profileGroupAtom.setFlamechartHoveredNode
    profileGroupAtom.setFlamechartHoveredNode = (
      id: any,
      hover: {node: CallTreeNode; event: MouseEvent} | null,
    ) => {
      if (id === 'SANDWICH_INVERTED_CALLERS') {
        setHoveredNodeCaller(hover)
      } else if (id === 'SANDWICH_CALLEES') {
        setHoveredNodeCallee(hover)
      }
    }

    return () => {
      profileGroupAtom.setSelectedFrame = originalSetSelectedFrame
      profileGroupAtom.setConfigSpaceViewportRect = originalSetConfigSpaceViewportRect
      profileGroupAtom.setLogicalSpaceViewportSize = originalSetLogicalSpaceViewportSize
      profileGroupAtom.setFlamechartHoveredNode = originalSetFlamechartHoveredNode
    }
  }, [profile])

  useLayoutEffect(() => {
    if (!glCanvasRef.current || !containerRef.current || !profile || canvasReady) return

    const canvas = glCanvasRef.current
    const container = containerRef.current

    glCanvasAtom.set(canvas)
    const canvasContext = getCanvasContext({theme: forcedTheme, canvas})

    // Wrap renderBehind to convert viewport coordinates to canvas coordinates
    const originalRenderBehind = canvasContext.renderBehind.bind(canvasContext)
    canvasContext.renderBehind = (el: Element, cb: () => void) => {
      const elBounds = el.getBoundingClientRect()
      const canvasBounds = canvas.getBoundingClientRect()

      const adjustedBounds = new DOMRect(
        elBounds.left - canvasBounds.left,
        elBounds.top - canvasBounds.top,
        elBounds.width,
        elBounds.height,
      )

      const proxyEl = {
        getBoundingClientRect: () => adjustedBounds,
      } as Element

      originalRenderBehind(proxyEl, cb)
    }

    canvasContextRef.current = canvasContext

    const maybeResize = () => {
      if (!container || !canvasContext) return
      const {width, height} = container.getBoundingClientRect()
      const widthInPixels = width * window.devicePixelRatio
      const heightInPixels = height * window.devicePixelRatio
      canvasContext.gl.resize(widthInPixels, heightInPixels, width, height)
    }

    canvasContext.addBeforeFrameHandler(maybeResize)
    maybeResize()

    requestAnimationFrame(() => {
      canvasContext.requestFrame()
    })

    setCanvasReady(true)
    return () => {
      if (canvasContext) {
        canvasContext.removeBeforeFrameHandler(maybeResize)
      }
    }
  }, [profile, canvasReady, forcedTheme])

  useEffect(() => {
    const onResize = () => {
      if (canvasContextRef.current) {
        canvasContextRef.current.requestFrame()
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (viewportStates) {
      setViewportStates(prev => {
        if (!prev) return prev
        return {
          invertedCallerFlamegraph: {
            ...prev.invertedCallerFlamegraph,
            hover: hoveredNodeCaller,
          },
          calleeFlamegraph: {
            ...prev.calleeFlamegraph,
            hover: hoveredNodeCallee,
          },
        }
      })
    }
  }, [hoveredNodeCaller, hoveredNodeCallee])

  useEffect(() => {
    if (canvasContextRef.current && selectedFrame && viewportStates) {
      requestAnimationFrame(() => {
        canvasContextRef.current?.requestFrame()
      })
    }
  }, [selectedFrame, viewportStates])

  useEffect(() => {
    if (!profileData) return

    async function loadProfile() {
      try {
        let profileGroup: ProfileGroup | null = null

        if (!profileData) {
          throw new Error('Profile data is required')
        }

        if (typeof profileData === 'string') {
          profileGroup = await importProfileGroupFromText(fileName, profileData)
        } else if (profileData instanceof ArrayBuffer) {
          profileGroup = await importProfilesFromArrayBuffer(fileName, profileData)
        } else if ('profiles' in profileData) {
          profileGroup = profileData as ProfileGroup
        } else {
          const singleProfile = profileData as Profile
          setProfile(singleProfile)
          onProfileLoad?.(singleProfile)
          return
        }

        if (profileGroup && profileGroup.profiles.length > 0) {
          const firstProfile = profileGroup.profiles[0]
          setProfile(firstProfile)
          onProfileLoad?.(firstProfile)
        } else {
          throw new Error('No profiles found in data')
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
      }
    }

    loadProfile()
  }, [profileData, fileName, onProfileLoad, onError])

  const style = getStyle(forcedTheme)

  const profileSearchResults: ProfileSearchResults | null = useMemo(() => {
    if (!profile || !searchIsActive || !searchQuery) return null
    return new ProfileSearchResults(profile, searchQuery)
  }, [profile, searchIsActive, searchQuery])

  const activeProfileState: ActiveProfileState | null = useMemo(() => {
    if (!profile) return null

    const initialViewportRect = new Rect(new Vec2(0, 0), new Vec2(profile.getTotalWeight(), 40))
    const initialLogicalSize = Vec2.zero

    return {
      profile,
      index: 0,
      chronoViewState: {
        hover: null,
        selectedNode: null,
        configSpaceViewportRect: initialViewportRect,
        logicalSpaceViewportSize: initialLogicalSize,
      },
      leftHeavyViewState: {
        hover: null,
        selectedNode: null,
        configSpaceViewportRect: initialViewportRect,
        logicalSpaceViewportSize: initialLogicalSize,
      },
      sandwichViewState: {
        callerCallee:
          selectedFrame && viewportStates
            ? {
                selectedFrame,
                invertedCallerFlamegraph: viewportStates.invertedCallerFlamegraph,
                calleeFlamegraph: viewportStates.calleeFlamegraph,
              }
            : null,
      },
    }
  }, [profile, selectedFrame, viewportStates])

  const sandwichContextData = useMemo(() => {
    if (!profile) return null

    const rowList: Frame[] = []
    profile.forEachFrame(frame => {
      rowList.push(frame)
    })

    rowList.sort((a, b) => b.getTotalWeight() - a.getTotalWeight())

    const indexByFrame = new Map<Frame, number>()
    for (let i = 0; i < rowList.length; i++) {
      indexByFrame.set(rowList[i], i)
    }

    return {
      rowList,
      selectedFrame,
      setSelectedFrame,
      getIndexForFrame: (frame: Frame) => {
        const index = indexByFrame.get(frame)
        return index == null ? null : index
      },
      getSearchMatchForFrame: () => null,
    }
  }, [profile, selectedFrame])

  if (error) {
    return (
      <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: 'red'}}>Error loading profile: {error.message}</div>
      </div>
    )
  }

  if (!profile || !activeProfileState || !sandwichContextData) {
    return (
      <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div>Loading profile...</div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={forcedTheme}>
      <ProfileSearchContext.Provider value={profileSearchResults}>
        <SandwichViewContext.Provider value={sandwichContextData}>
          <div
            ref={containerRef}
            className={css(style.root)}
            style={{
              width,
              height,
              fontFamily: FontFamily.MONOSPACE,
              lineHeight: '20px',
            }}
          >
            <canvas
              ref={glCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {canvasReady && glCanvasRef.current && (
              <SandwichViewContainer
                activeProfileState={activeProfileState}
                glCanvas={glCanvasRef.current}
              />
            )}
          </div>
        </SandwichViewContext.Provider>
      </ProfileSearchContext.Provider>
    </ThemeContext.Provider>
  )
}
