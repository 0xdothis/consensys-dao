'use client'

import React from 'react'
import { useNetworkAware } from '@/lib/responsive'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: boolean
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  variant = 'rectangular',
  animation = true
}) => {
  const { shouldOptimize } = useNetworkAware()

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'rounded'
      case 'circular':
        return 'rounded-full'
      case 'rectangular':
      default:
        return 'rounded-md'
    }
  }

  const animationClass = animation && !shouldOptimize ? 'skeleton' : 'bg-gray-200'

  return (
    <div 
      className={`${animationClass} ${getVariantClasses()} ${width} ${height} ${className}`}
      role="status"
      aria-label="Loading..."
    />
  )
}

export default Skeleton

// Skeleton components for common UI patterns
export const CardSkeleton: React.FC<{ 
  showImage?: boolean
  showActions?: boolean 
  className?: string
}> = ({ 
  showImage = false, 
  showActions = false,
  className = ''
}) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    {showImage && (
      <Skeleton variant="rectangular" width="w-full" height="h-48" className="mb-4" />
    )}
    <Skeleton variant="text" width="w-3/4" height="h-6" className="mb-2" />
    <Skeleton variant="text" width="w-full" height="h-4" className="mb-2" />
    <Skeleton variant="text" width="w-2/3" height="h-4" className="mb-4" />
    {showActions && (
      <div className="flex space-x-2">
        <Skeleton variant="rectangular" width="w-20" height="h-8" />
        <Skeleton variant="rectangular" width="w-16" height="h-8" />
      </div>
    )}
  </div>
)

export const ListSkeleton: React.FC<{ 
  items?: number
  showAvatar?: boolean
  className?: string
}> = ({ 
  items = 3, 
  showAvatar = false,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
        {showAvatar && (
          <Skeleton variant="circular" width="w-12" height="h-12" />
        )}
        <div className="flex-1">
          <Skeleton variant="text" width="w-1/2" height="h-5" className="mb-2" />
          <Skeleton variant="text" width="w-3/4" height="h-4" />
        </div>
      </div>
    ))}
  </div>
)

export const TableSkeleton: React.FC<{ 
  rows?: number
  columns?: number
  className?: string
}> = ({ 
  rows = 5, 
  columns = 4,
  className = ''
}) => (
  <div className={`w-full ${className}`}>
    {/* Header */}
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} variant="text" height="h-5" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`row-${rowIndex}-col-${colIndex}`} variant="text" height="h-4" />
        ))}
      </div>
    ))}
  </div>
)

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    <div className="flex items-center">
      <Skeleton variant="circular" width="w-12" height="h-12" className="mr-4" />
      <div className="flex-1">
        <Skeleton variant="text" width="w-1/2" height="h-4" className="mb-2" />
        <Skeleton variant="text" width="w-1/3" height="h-8" />
      </div>
    </div>
  </div>
)

export const FormSkeleton: React.FC<{ 
  fields?: number
  showSubmit?: boolean
  className?: string
}> = ({ 
  fields = 3, 
  showSubmit = true,
  className = ''
}) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index}>
        <Skeleton variant="text" width="w-1/4" height="h-5" className="mb-2" />
        <Skeleton variant="rectangular" width="w-full" height="h-10" />
      </div>
    ))}
    {showSubmit && (
      <Skeleton variant="rectangular" width="w-32" height="h-10" className="mt-6" />
    )}
  </div>
)

export const NotificationSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-3 ${className}`}>
    <div className="flex items-start space-x-3">
      <Skeleton variant="circular" width="w-2" height="h-2" className="mt-2" />
      <div className="flex-1">
        <Skeleton variant="text" width="w-1/2" height="h-4" className="mb-1" />
        <Skeleton variant="text" width="w-full" height="h-4" className="mb-2" />
        <Skeleton variant="text" width="w-1/4" height="h-3" />
      </div>
      <Skeleton variant="rectangular" width="w-4" height="h-4" />
    </div>
  </div>
)

export const ActivitySkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-3 ${className}`}>
    <div className="flex items-start space-x-3">
      <Skeleton variant="rectangular" width="w-4" height="h-4" className="mt-1" />
      <div className="flex-1">
        <Skeleton variant="text" width="w-2/3" height="h-4" className="mb-1" />
        <Skeleton variant="text" width="w-full" height="h-4" className="mb-2" />
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="w-1/4" height="h-3" />
          <Skeleton variant="text" width="w-1/6" height="h-3" />
        </div>
      </div>
    </div>
  </div>
)

// Page-level skeleton layouts
export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <header className="bg-white shadow-sm">
      <div className="responsive-container py-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton variant="text" width="w-48" height="h-8" className="mb-2" />
            <Skeleton variant="text" width="w-64" height="h-4" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" width="w-10" height="h-10" />
            <Skeleton variant="rectangular" width="w-32" height="h-10" />
          </div>
        </div>
      </div>
    </header>
    
    <div className="responsive-container py-8">
      <div className="mb-8">
        <Skeleton variant="rectangular" width="w-full" height="h-32" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
          <CardSkeleton showActions />
        </div>
        
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const LoadingSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const { shouldOptimize } = useNetworkAware()
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  if (shouldOptimize) {
    // Simple spinner for slow connections
    return (
      <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full ${className}`}>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
  
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m 4 12 a 8 8 0 0 1 8 -8 V 0 a 12 12 0 0 0 -12 12 h 4 z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
