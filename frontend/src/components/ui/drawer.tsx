'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useIsMobile } from '@/lib/responsive'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  position?: 'left' | 'right' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  className = ''
}) => {
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      document.body.style.overflow = 'unset'
      return () => clearTimeout(timer)
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isVisible) return null

  const getDrawerClasses = () => {
    const baseClasses = 'fixed bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out'
    
    const sizeClasses = {
      sm: position === 'bottom' ? 'h-1/3' : 'w-80',
      md: position === 'bottom' ? 'h-1/2' : 'w-96',
      lg: position === 'bottom' ? 'h-2/3' : 'w-1/2',
      full: position === 'bottom' ? 'h-full' : 'w-full'
    }

    const positionClasses = {
      left: `top-0 left-0 h-full border-r ${sizeClasses[size]}`,
      right: `top-0 right-0 h-full border-l ${sizeClasses[size]}`,
      bottom: `bottom-0 left-0 right-0 border-t rounded-t-xl ${sizeClasses[size]}`
    }

    const transformClasses = {
      left: isOpen ? 'translate-x-0' : '-translate-x-full',
      right: isOpen ? 'translate-x-0' : 'translate-x-full',
      bottom: isOpen ? 'translate-y-0' : 'translate-y-full'
    }

    return `${baseClasses} ${positionClasses[position]} ${transformClasses[position]} ${className}`
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={getDrawerClasses()}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={`${title ? 'h-[calc(100%-73px)]' : 'h-full'} overflow-y-auto`}>
          {children}
        </div>
      </div>
    </>
  )
}

export default Drawer

// Mobile-specific navigation drawer
export const MobileNavDrawer: React.FC<{
  isOpen: boolean
  onClose: () => void
  menuItems: Array<{
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
    badge?: string
  }>
}> = ({ isOpen, onClose, menuItems }) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="left"
      size="sm"
      title="Navigation"
    >
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.title}
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                {Icon && <Icon className="w-5 h-5 text-gray-600" />}
                <span className="text-gray-900">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            )
          })}
        </nav>
      </div>
    </Drawer>
  )
}

// Bottom sheet for mobile actions
export const BottomSheet: React.FC<{
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}> = ({ isOpen, onClose, title, children }) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      size="md"
      title={title}
      className="rounded-t-xl"
    >
      {children}
    </Drawer>
  )
}
