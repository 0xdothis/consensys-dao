import { useEffect, useState, useCallback } from 'react'

// Event types for the DAO system
export interface DAOEvent {
  id: string
  type: 'loan_created' | 'vote_cast' | 'proposal_created' | 'member_joined' | 'yield_distributed' | 'loan_repaid' | 'document_uploaded'
  blockNumber: number
  transactionHash: string
  timestamp: Date
  data: Record<string, unknown>
  processed: boolean
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  actionUrl?: string
  metadata?: Record<string, unknown>
}

// Mock event data generator
const generateMockEvent = (type: DAOEvent['type']): DAOEvent => {
  const events = {
    loan_created: {
      title: 'New Loan Request',
      message: 'A new loan proposal has been created',
      data: { amount: '10.5 ETH', proposer: '0x1234...5678' }
    },
    vote_cast: {
      title: 'Vote Cast',
      message: 'A member has voted on a proposal',
      data: { proposal: 'Proposal #42', vote: 'for' }
    },
    proposal_created: {
      title: 'New Proposal',
      message: 'A new governance proposal has been created',
      data: { title: 'Increase Max Loan Amount', creator: '0x2345...6789' }
    },
    member_joined: {
      title: 'New Member',
      message: 'A new member has joined the DAO',
      data: { address: '0x3456...7890', joiningFee: '1.0 ETH' }
    },
    yield_distributed: {
      title: 'Yield Distribution',
      message: 'Restaking yields have been distributed to members',
      data: { totalYield: '25.3 ETH', recipients: 156 }
    },
    loan_repaid: {
      title: 'Loan Repaid',
      message: 'A loan has been successfully repaid',
      data: { amount: '12.1 ETH', borrower: '0x4567...8901' }
    },
    document_uploaded: {
      title: 'Document Uploaded',
      message: 'A new document has been uploaded to IPFS',
      data: { filename: 'Financial_Report_Q3.pdf', encrypted: true }
    }
  }

  const eventInfo = events[type]
  
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
    transactionHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
    timestamp: new Date(),
    data: eventInfo.data,
    processed: false
  }
}

// Event listener hook
export const useEventListener = () => {
  const [events, setEvents] = useState<DAOEvent[]>([])
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addEvent = useCallback((event: DAOEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 99)]) // Keep last 100 events
  }, [])

  const startListening = useCallback(() => {
    setIsListening(true)
    setError(null)

    // Mock event generation for demonstration
    const interval = setInterval(() => {
      const eventTypes: DAOEvent['type'][] = [
        'loan_created', 'vote_cast', 'proposal_created', 
        'member_joined', 'yield_distributed', 'loan_repaid', 'document_uploaded'
      ]
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const mockEvent = generateMockEvent(randomType)
      addEvent(mockEvent)
    }, 15000 + Math.random() * 30000) // Random interval between 15-45 seconds

    return () => {
      clearInterval(interval)
      setIsListening(false)
    }
  }, [addEvent])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  const markEventProcessed = useCallback((eventId: string) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, processed: true }
          : event
      )
    )
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    events,
    isListening,
    error,
    startListening,
    stopListening,
    markEventProcessed,
    clearEvents,
    addEvent
  }
}

// Notification system hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationData = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      })
    }
    
    return newNotification.id
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId && !notif.read
          ? { ...notif, read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== notificationId)
    })
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestPermission
  }
}

// Convert DAO events to notifications
export const convertEventToNotification = (event: DAOEvent): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => {
  const notificationMap = {
    loan_created: {
      title: 'New Loan Request',
      message: `Loan request for ${event.data.amount} created by ${event.data.proposer}`,
      type: 'info' as const,
      actionUrl: '/loans'
    },
    vote_cast: {
      title: 'Vote Cast',
      message: `Vote cast on ${event.data.proposal}`,
      type: 'info' as const,
      actionUrl: '/governance'
    },
    proposal_created: {
      title: 'New Proposal',
      message: `"${event.data.title}" created by ${event.data.creator}`,
      type: 'info' as const,
      actionUrl: '/governance'
    },
    member_joined: {
      title: 'New Member',
      message: `${event.data.address} joined with ${event.data.joiningFee} fee`,
      type: 'success' as const,
      actionUrl: '/dashboard'
    },
    yield_distributed: {
      title: 'Yield Distribution',
      message: `${event.data.totalYield} distributed to ${event.data.recipients} members`,
      type: 'success' as const,
      actionUrl: '/treasury'
    },
    loan_repaid: {
      title: 'Loan Repaid',
      message: `${event.data.amount} loan repaid by ${event.data.borrower}`,
      type: 'success' as const,
      actionUrl: '/loans'
    },
    document_uploaded: {
      title: 'Document Uploaded',
      message: `${event.data.filename} uploaded${event.data.encrypted ? ' (encrypted)' : ''}`,
      type: 'info' as const,
      actionUrl: '/privacy'
    }
  }

  return {
    ...notificationMap[event.type],
    metadata: { event }
  }
}

// Auto-notification hook that converts events to notifications
export const useAutoNotifications = () => {
  const { events, startListening, stopListening, isListening } = useEventListener()
  const { addNotification, ...notificationMethods } = useNotifications()
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(true)

  // Convert new events to notifications
  useEffect(() => {
    if (!autoNotifyEnabled) return

    events.forEach(event => {
      if (!event.processed) {
        const notification = convertEventToNotification(event)
        addNotification(notification)
      }
    })
  }, [events, autoNotifyEnabled, addNotification])

  const enableAutoNotifications = useCallback(() => {
    setAutoNotifyEnabled(true)
    if (!isListening) {
      startListening()
    }
  }, [isListening, startListening])

  const disableAutoNotifications = useCallback(() => {
    setAutoNotifyEnabled(false)
    stopListening()
  }, [stopListening])

  return {
    events,
    isListening,
    autoNotifyEnabled,
    enableAutoNotifications,
    disableAutoNotifications,
    startListening,
    stopListening,
    ...notificationMethods
  }
}

// Event filtering utilities
export const filterEvents = (
  events: DAOEvent[], 
  filters: {
    types?: DAOEvent['type'][]
    dateFrom?: Date
    dateTo?: Date
    processed?: boolean
  }
): DAOEvent[] => {
  return events.filter(event => {
    if (filters.types && !filters.types.includes(event.type)) return false
    if (filters.dateFrom && event.timestamp < filters.dateFrom) return false
    if (filters.dateTo && event.timestamp > filters.dateTo) return false
    if (filters.processed !== undefined && event.processed !== filters.processed) return false
    return true
  })
}

// Real-time data update utilities
export const useRealTimeData = <T>(
  initialData: T,
  updateInterval: number = 30000 // 30 seconds default
) => {
  const [data, setData] = useState<T>(initialData)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isUpdating, setIsUpdating] = useState(false)

  const updateData = useCallback((newData: T) => {
    setData(newData)
    setLastUpdate(new Date())
  }, [])

  const forceUpdate = useCallback(() => {
    setIsUpdating(true)
    // Simulate data fetch
    setTimeout(() => {
      setLastUpdate(new Date())
      setIsUpdating(false)
    }, 1000)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate()
    }, updateInterval)

    return () => clearInterval(interval)
  }, [updateInterval, forceUpdate])

  return {
    data,
    lastUpdate,
    isUpdating,
    updateData,
    forceUpdate
  }
}

// Activity feed utilities
export interface ActivityItem {
  id: string
  type: 'loan' | 'vote' | 'proposal' | 'member' | 'treasury' | 'document'
  title: string
  description: string
  timestamp: Date
  user?: string
  metadata?: Record<string, unknown>
}

export const convertEventToActivity = (event: DAOEvent): ActivityItem => {
  const activityMap = {
    loan_created: {
      type: 'loan' as const,
      title: 'Loan Request Created',
      description: `New loan request for ${event.data.amount}`,
      user: event.data.proposer
    },
    vote_cast: {
      type: 'vote' as const,
      title: 'Vote Cast',
      description: `Vote cast on ${event.data.proposal}`,
      user: undefined // Anonymous voting
    },
    proposal_created: {
      type: 'proposal' as const,
      title: 'Proposal Created',
      description: `"${event.data.title}" proposal created`,
      user: event.data.creator
    },
    member_joined: {
      type: 'member' as const,
      title: 'New Member Joined',
      description: `New member joined with ${event.data.joiningFee}`,
      user: event.data.address
    },
    yield_distributed: {
      type: 'treasury' as const,
      title: 'Yield Distributed',
      description: `${event.data.totalYield} distributed to ${event.data.recipients} members`,
      user: undefined
    },
    loan_repaid: {
      type: 'loan' as const,
      title: 'Loan Repaid',
      description: `${event.data.amount} loan successfully repaid`,
      user: event.data.borrower
    },
    document_uploaded: {
      type: 'document' as const,
      title: 'Document Uploaded',
      description: `${event.data.filename} uploaded${event.data.encrypted ? ' (encrypted)' : ''}`,
      user: undefined
    }
  }

  const activity = activityMap[event.type]
  
  return {
    id: event.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    timestamp: event.timestamp,
    user: activity.user,
    metadata: { event }
  }
}

// WebSocket connection for real-time updates (mock implementation)
export class DAOWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Map<string, ((...args: unknown[]) => void)[]> = new Map()

  constructor(private url: string = 'wss://mock-dao-websocket.com') {
    // Mock WebSocket for development
  }

  connect() {
    try {
      // Mock WebSocket connection
      this.reconnectAttempts = 0
      this.emit('connected', { timestamp: new Date() })
      
      // Simulate periodic events
      setInterval(() => {
        this.simulateEvent()
      }, 20000 + Math.random() * 20000) // Random events every 20-40 seconds
      
    } catch (error) {
      this.handleError(error)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)?.push(handler)
  }

  off(event: string, handler: (...args: unknown[]) => void) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: unknown) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  private simulateEvent() {
    const eventTypes: DAOEvent['type'][] = [
      'loan_created', 'vote_cast', 'proposal_created', 
      'member_joined', 'yield_distributed', 'loan_repaid', 'document_uploaded'
    ]
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const mockEvent = generateMockEvent(randomType)
    
    this.emit('dao_event', mockEvent)
  }

  private handleError(error: unknown) {
    console.error('WebSocket error:', error)
    this.emit('error', error)
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
    }
  }
}

// Global WebSocket instance
let globalWebSocket: DAOWebSocket | null = null

export const getWebSocketInstance = (): DAOWebSocket => {
  if (!globalWebSocket) {
    globalWebSocket = new DAOWebSocket()
  }
  return globalWebSocket
}

// Activity feed hook
export const useActivityFeed = (limit: number = 50) => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const { events } = useEventListener()

  useEffect(() => {
    const newActivities = events
      .map(convertEventToActivity)
      .slice(0, limit)
    
    setActivities(newActivities)
  }, [events, limit])

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...activity
    }
    
    setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)])
  }, [limit])

  return {
    activities,
    addActivity
  }
}

// Push notification utilities
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return false
    
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [supported])

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return null
    
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  }, [permission])

  return {
    supported,
    permission,
    requestPermission,
    sendNotification
  }
}
