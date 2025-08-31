'use client'

import React, { useState, useEffect } from 'react'
import { 
  useAutoNotifications, 
  useActivityFeed,
  usePushNotifications,
  type NotificationData,
  type ActivityItem 
} from '@/lib/eventListener'
import { useIsMobile, useResponsiveModal } from '@/lib/responsive'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Settings,
  Activity,
  Clock,
  User,
  FileText,
  Vote,
  DollarSign,
  Users,
  Wallet,
  Shield
} from 'lucide-react'

interface NotificationCenterProps {
  className?: string
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'activity'>('notifications')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  
  const isMobile = useIsMobile()
  const { shouldUseDrawer } = useResponsiveModal()

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestPermission,
    enableAutoNotifications,
    disableAutoNotifications,
    autoNotifyEnabled,
    startListening,
    stopListening,
    isListening
  } = useAutoNotifications()

  const { activities } = useActivityFeed(50)
  const { supported, permission, requestPermission: requestPushPermission } = usePushNotifications()

  // Auto-start listening when component mounts
  useEffect(() => {
    if (!isListening && autoNotifyEnabled) {
      startListening()
    }
  }, [isListening, autoNotifyEnabled, startListening])

  // Request notification permissions on first interaction
  useEffect(() => {
    if (supported && permission === 'default') {
      requestPushPermission()
    }
  }, [supported, permission, requestPushPermission])

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || !notif.read
  )

  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconMap = {
      loan: DollarSign,
      vote: Vote,
      proposal: FileText,
      member: Users,
      treasury: Wallet,
      document: Shield
    }
    const Icon = iconMap[type] || Activity
    return <Icon className="w-4 h-4" />
  }

  const getNotificationTypeColor = (type: NotificationData['type']) => {
    const colorMap = {
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200'
    }
    return colorMap[type] || colorMap.info
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className={`absolute ${isMobile ? 'left-0 right-0 top-full' : 'right-0 top-full'} mt-2 ${isMobile ? 'w-screen' : 'w-96'} bg-white ${isMobile ? 'rounded-t-xl' : 'rounded-xl'} shadow-xl border z-50 ${isMobile ? 'max-h-screen' : 'max-h-96'} flex flex-col`}>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 ${isMobile ? 'text-xs py-3' : 'text-sm py-2'} px-3 rounded-md transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 ${isMobile ? 'text-xs py-3' : 'text-sm py-2'} px-3 rounded-md transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Activity
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mt-3">
                {activeTab === 'notifications' && (
                  <>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFilter('all')}
                        className={`text-xs px-2 py-1 rounded ${
                          filter === 'all' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('unread')}
                        className={`text-xs px-2 py-1 rounded ${
                          filter === 'unread' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Unread
                      </button>
                    </div>
                    
                    {filteredNotifications.length > 0 && (
                      <div className="flex space-x-1">
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-gray-600 hover:text-gray-700"
                          title="Clear all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === 'activity' && (
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center text-xs ${
                      isListening ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <Activity className={`w-3 h-3 mr-1 ${isListening ? 'animate-pulse' : ''}`} />
                      {isListening ? 'Live' : 'Paused'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'notifications' ? (
                <div className="divide-y">
                  {filteredNotifications.length === 0 ? (
                    <div className={`${isMobile ? 'p-6' : 'p-8'} text-center text-gray-500`}>
                      <Bell className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-3 opacity-30`} />
                      <p className={isMobile ? 'text-sm' : ''}>No notifications yet</p>
                      <p className="text-xs mt-1">
                        {!autoNotifyEnabled ? (
                          <button
                            onClick={enableAutoNotifications}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Enable notifications
                          </button>
                        ) : (
                          "You're all caught up!"
                        )}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id)
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl
                            setIsOpen(false)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                getNotificationTypeColor(notification.type).split(' ')[1]
                              }`} />
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="ml-2 p-1 hover:bg-gray-200 rounded"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {activities.length === 0 ? (
                    <div className={`${isMobile ? 'p-6' : 'p-8'} text-center text-gray-500`}>
                      <Activity className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-3 opacity-30`} />
                      <p className={isMobile ? 'text-sm' : ''}>No recent activity</p>
                      <p className="text-xs mt-1">
                        DAO events will appear here as they happen
                      </p>
                    </div>
                  ) : (
                    activities.map(activity => (
                      <div key={activity.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {activity.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {activity.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(activity.timestamp)}</span>
                              </div>
                              {activity.user && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span className="truncate max-w-20">
                                    {activity.user}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Settings className="w-3 h-3" />
                  <span>Settings</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {activeTab === 'notifications' && (
                    <>
                      <button
                        onClick={autoNotifyEnabled ? disableAutoNotifications : enableAutoNotifications}
                        className={`text-xs px-2 py-1 rounded ${
                          autoNotifyEnabled 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {autoNotifyEnabled ? 'Auto On' : 'Auto Off'}
                      </button>
                      
                      {supported && permission !== 'granted' && (
                        <button
                          onClick={requestPermission}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          Enable Push
                        </button>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'activity' && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`text-xs px-2 py-1 rounded ${
                        isListening 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {isListening ? 'Stop' : 'Start'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter
