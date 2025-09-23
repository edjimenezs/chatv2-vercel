import { NextApiRequest, NextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket.server.io) {
    console.log('🚀 Inicializando servidor WebSocket...')
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('👤 Usuario conectado:', socket.id)

      socket.on('user-message', (data: { message: string }) => {
        console.log('📨 Mensaje recibido:', data.message)
        
        setTimeout(() => {
          const botResponse = generateBotResponse(data.message)
          socket.emit('bot-message', { message: botResponse })
          console.log('🤖 Respuesta enviada:', botResponse)
        }, 1000 + Math.random() * 2000)
      })

      socket.on('disconnect', () => {
        console.log('👋 Usuario desconectado:', socket.id)
      })
    })
  } else {
    console.log('✅ WebSocket ya está ejecutándose')
  }
  res.end()
}

function generateBotResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()
  
  const responses = {
    greeting: [
      '¡Hola! ¿Cómo estás?',
      '¡Saludos! ¿En qué puedo ayudarte?',
      '¡Hola! Me da mucho gusto verte por aquí.'
    ],
    question: [
      'Esa es una excelente pregunta. ¿Podrías ser más específico?',
      'Interesante pregunta. Déjame pensar en eso...',
      'Me gusta tu curiosidad. ¿Hay algo más que te gustaría saber?'
    ],
    help: [
      'Estoy aquí para ayudarte. ¿Qué necesitas?',
      'Puedo ayudarte con información general. ¿Qué te interesa?',
      '¡Por supuesto! Estoy aquí para asistirte.'
    ],
    goodbye: [
      '¡Hasta luego! Fue un placer charlar contigo.',
      '¡Adiós! Que tengas un excelente día.',
      '¡Nos vemos pronto! Cuídate mucho.'
    ],
    websocket: [
      '¡Genial! Estamos usando WebSocket para comunicación en tiempo real!',
      'WebSocket permite respuestas instantáneas. ¿No es genial?',
      'La conexión WebSocket está funcionando perfectamente.'
    ],
    default: [
      'Eso es muy interesante. ¿Podrías contarme más?',
      'Entiendo. ¿Hay algo específico en lo que pueda ayudarte?',
      'Gracias por compartir eso conmigo. ¿Qué más te gustaría saber?',
      'Me parece fascinante. ¿Tienes alguna pregunta?'
    ]
  }

  if (message.includes('hola') || message.includes('hi') || message.includes('buenos días') || message.includes('buenas tardes') || message.includes('buenas noches')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)]
  }
  
  if (message.includes('?') || message.includes('qué') || message.includes('cómo') || message.includes('cuándo') || message.includes('dónde') || message.includes('por qué')) {
    return responses.question[Math.floor(Math.random() * responses.question.length)]
  }
  
  if (message.includes('ayuda') || message.includes('help') || message.includes('asistencia')) {
    return responses.help[Math.floor(Math.random() * responses.help.length)]
  }
  
  if (message.includes('adiós') || message.includes('bye') || message.includes('hasta luego') || message.includes('nos vemos')) {
    return responses.goodbye[Math.floor(Math.random() * responses.goodbye.length)]
  }

  if (message.includes('websocket') || message.includes('tiempo real') || message.includes('instantáneo')) {
    return responses.websocket[Math.floor(Math.random() * responses.websocket.length)]
  }
  
  return responses.default[Math.floor(Math.random() * responses.default.length)]
}

export default SocketHandler
