import { useState, useEffect } from 'react'

// PWA BeforeInstallPrompt event interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

// Breakpoint definitions (following Tailwind CSS conventions)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export type Breakpoint = keyof typeof breakpoints

// Hook to detect current screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<Breakpoint>('lg')
  const [width, setWidth] = useState<number>(1024)

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      setWidth(width)
      
      if (width < breakpoints.sm) {
        setScreenSize('sm')
      } else if (width < breakpoints.md) {
        setScreenSize('md')
      } else if (width < breakpoints.lg) {
        setScreenSize('lg')
      } else if (width < breakpoints.xl) {
        setScreenSize('xl')
      } else {
        setScreenSize('2xl')
      }
    }

    // Set initial size
    updateSize()

    // Add event listener
    window.addEventListener('resize', updateSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return { screenSize, width }
}

// Hook to check if screen is mobile
export const useIsMobile = () => {
  const { screenSize } = useScreenSize()
  return screenSize === 'sm'
}

// Hook to check if screen is tablet
export const useIsTablet = () => {
  const { screenSize } = useScreenSize()
  return screenSize === 'md'
}

// Hook to check if screen is desktop
export const useIsDesktop = () => {
  const { screenSize } = useScreenSize()
  return ['lg', 'xl', '2xl'].includes(screenSize)
}

// Responsive grid utilities
export const getResponsiveGridCols = (mobile: number, tablet: number, desktop: number): string => {
  return `grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`
}

// Responsive spacing utilities
export const getResponsiveSpacing = (mobile: string, desktop: string): string => {
  return `${mobile} lg:${desktop}`
}

// Responsive text sizes
export const getResponsiveTextSize = (mobile: string, desktop: string): string => {
  return `${mobile} lg:${desktop}`
}

// Responsive padding/margin
export const getResponsivePadding = (mobile: string, desktop: string): string => {
  return `${mobile} lg:${desktop}`
}

// Container width utilities
export const containerWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
} as const

export type ContainerWidth = keyof typeof containerWidths

// Mobile navigation utilities
export const useMobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { screenSize } = useScreenSize()

  // Auto-close mobile nav when screen becomes desktop
  useEffect(() => {
    if (['lg', 'xl', '2xl'].includes(screenSize)) {
      setIsOpen(false)
    }
  }, [screenSize])

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return {
    isOpen,
    toggle,
    close,
    open,
    isMobile: screenSize === 'sm' || screenSize === 'md'
  }
}

// Touch gesture utilities for mobile
export const useTouchGestures = () => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    return { isLeftSwipe, isRightSwipe }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}

// Responsive image utilities
export const getResponsiveImageSizes = (mobile: string, tablet: string, desktop: string): string => {
  return `(max-width: ${breakpoints.sm}px) ${mobile}, (max-width: ${breakpoints.lg}px) ${tablet}, ${desktop}`
}

// Adaptive component sizing
export const useAdaptiveSize = (baseSize: number = 16) => {
  const { width } = useScreenSize()
  
  // Scale factor based on screen width
  const scaleFactor = Math.min(Math.max(width / 1024, 0.8), 1.2)
  
  return Math.round(baseSize * scaleFactor)
}

// Responsive table utilities
export const useResponsiveTable = (columns: string[]) => {
  const { screenSize } = useScreenSize()
  
  // On mobile, show only essential columns
  const visibleColumns = screenSize === 'sm' 
    ? columns.slice(0, 2) 
    : screenSize === 'md'
    ? columns.slice(0, 3)
    : columns

  const shouldShowColumn = (columnIndex: number): boolean => {
    return columnIndex < visibleColumns.length
  }

  const getMobileCardLayout = () => screenSize === 'sm'

  return {
    visibleColumns,
    shouldShowColumn,
    getMobileCardLayout
  }
}

// Performance optimization for mobile
export const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reduceMotion
}

// Network-aware loading for mobile
export const useNetworkAware = () => {
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    // @ts-expect-error - navigator.connection is not in TypeScript definitions
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown')
      setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType))

      const handleChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
        setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType))
      }

      connection.addEventListener('change', handleChange)
      return () => connection.removeEventListener('change', handleChange)
    }
  }, [])

  return {
    connectionType,
    isSlowConnection,
    shouldOptimize: isSlowConnection
  }
}

// Accessibility utilities for mobile
export const useAccessibility = () => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal')
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    // Check for accessibility preferences
    const highContrastMode = window.matchMedia('(prefers-contrast: high)')
    
    setHighContrast(highContrastMode.matches)

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }

    highContrastMode.addEventListener('change', handleContrastChange)
    return () => highContrastMode.removeEventListener('change', handleContrastChange)
  }, [])

  const getFontSizeClass = (): string => {
    const sizeMap = {
      normal: '',
      large: 'text-lg',
      'extra-large': 'text-xl'
    }
    return sizeMap[fontSize]
  }

  const getContrastClass = (): string => {
    return highContrast ? 'contrast-high' : ''
  }

  return {
    fontSize,
    setFontSize,
    highContrast,
    getFontSizeClass,
    getContrastClass
  }
}

// Progressive Web App utilities
export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setIsInstallable(false)
    }
    
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall
  }
}

// Responsive card layout utilities
export const useResponsiveCardLayout = () => {
  const { screenSize } = useScreenSize()

  const getCardGridClass = (itemCount: number): string => {
    if (screenSize === 'sm') {
      return 'grid-cols-1'
    } else if (screenSize === 'md') {
      return itemCount <= 2 ? 'grid-cols-2' : 'grid-cols-2'
    } else {
      return itemCount <= 2 ? 'grid-cols-2' : itemCount <= 3 ? 'grid-cols-3' : 'grid-cols-4'
    }
  }

  const getCardSize = (): 'compact' | 'normal' | 'large' => {
    if (screenSize === 'sm') return 'compact'
    if (screenSize === 'md') return 'normal'
    return 'large'
  }

  return {
    getCardGridClass,
    getCardSize
  }
}

// Modal responsive utilities
export const useResponsiveModal = () => {
  const { screenSize } = useScreenSize()

  const getModalSize = (): string => {
    if (screenSize === 'sm') {
      return 'w-full h-full m-0 rounded-none' // Fullscreen on mobile
    } else if (screenSize === 'md') {
      return 'w-11/12 max-w-lg rounded-lg'
    } else {
      return 'w-full max-w-2xl rounded-lg'
    }
  }

  const getModalPosition = (): string => {
    if (screenSize === 'sm') {
      return 'inset-0' // Fullscreen positioning
    } else {
      return 'inset-4 m-auto'
    }
  }

  const shouldUseDrawer = (): boolean => {
    return screenSize === 'sm'
  }

  return {
    getModalSize,
    getModalPosition,
    shouldUseDrawer
  }
}

// Form responsive utilities
export const useResponsiveForm = () => {
  const { screenSize } = useScreenSize()

  const getFormLayout = (): 'single-column' | 'two-column' | 'three-column' => {
    if (screenSize === 'sm') return 'single-column'
    if (screenSize === 'md') return 'two-column'
    return 'three-column'
  }

  const getFieldSpacing = (): string => {
    if (screenSize === 'sm') return 'space-y-4'
    return 'space-y-6'
  }

  const getButtonSize = (): 'sm' | 'md' | 'lg' => {
    if (screenSize === 'sm') return 'md'
    return 'lg'
  }

  return {
    getFormLayout,
    getFieldSpacing,
    getButtonSize
  }
}
