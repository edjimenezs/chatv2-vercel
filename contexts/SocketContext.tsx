import { createContext, useContext, useState } from 'react'

interface SocketContextType {
  socket: null
  isConnected: boolean
  sendMessage: (message: string) => Promise<string>
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: async () => ''
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

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected] = useState(true) // Siempre conectado en modo HTTP

  // Función para enviar mensaje usando HTTP
  const sendMessage = async (message: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      return 'Lo siento, hubo un error al procesar tu mensaje.'
    }
  }

  return (
    <SocketContext.Provider value={{ socket: null, isConnected, sendMessage }}>
      {children}
    </SocketContext.Provider>
  )
}