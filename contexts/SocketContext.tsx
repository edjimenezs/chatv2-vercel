import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (message: string) => Promise<string>
  isLoading: boolean
  connectionMode: 'websocket' | 'http'
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: async () => '',
  isLoading: false,
  connectionMode: 'http'
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'http'>('http')

  // Función para enviar mensaje usando HTTP como fallback
  const sendMessageHTTP = useCallback(async (message: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('Error enviando mensaje HTTP:', error)
      return 'Lo siento, hubo un error al procesar tu mensaje.'
    }
  }, [])

  // Función principal para enviar mensajes
  const sendMessage = useCallback(async (message: string): Promise<string> => {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return 'Por favor, escribe un mensaje válido.'
    }

    setIsLoading(true)

    try {
      // Intentar WebSocket primero si está disponible
      if (connectionMode === 'websocket' && socket && isConnected) {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve('Lo siento, el servidor tardó demasiado en responder.')
          }, 10000)

          socket.emit('user-message', { message: message.trim() })
          
          const handleResponse = (data: { message: string }) => {
            clearTimeout(timeout)
            socket.off('bot-message', handleResponse)
            resolve(data.message)
          }
          
          socket.on('bot-message', handleResponse)
        })
      } else {
        // Fallback a HTTP
        return await sendMessageHTTP(message)
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      return 'Lo siento, hubo un error al procesar tu mensaje.'
    } finally {
      setIsLoading(false)
    }
  }, [connectionMode, socket, isConnected, sendMessageHTTP])

  // Inicializar WebSocket
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000'

      const newSocket = io(socketUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        setConnectionMode('websocket')
        console.log('✅ Conectado via WebSocket')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        setConnectionMode('http')
        console.log('❌ Desconectado de WebSocket, usando HTTP')
      })

      newSocket.on('connect_error', (error) => {
        console.error('Error de conexión WebSocket:', error)
        setIsConnected(false)
        setConnectionMode('http')
        console.log('🔄 Cambiando a modo HTTP fallback')
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [])

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      sendMessage, 
      isLoading, 
      connectionMode 
    }}>
      {children}
    </SocketContext.Provider>
  )
}
