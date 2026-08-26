import { io, Socket } from 'socket.io-client'
import { ref, onUnmounted } from 'vue'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8765'

let socket: Socket | null = null

/** 创建/获取单例 WebSocket 连接 */
export function useSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/** 断开并销毁连接 */
export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

// ── 任务进度 Hook ──

export interface TaskProgress {
  taskId: string
  progress: number // 0-100
  stage: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  error?: string
}

/**
 * 封装 WebSocket 任务进度监听
 * 用法: const { progress, error } = useTaskProgress(taskId)
 */
export function useTaskProgress(taskId: string) {
  const progress = ref<TaskProgress | null>(null)
  const error = ref<string | null>(null)
  const connected = ref(false)

  const sock = useSocket()

  function connect() {
    if (!sock.connected) {
      sock.connect()
    }
    connected.value = sock.connected

    sock.emit('subscribe:task', { taskId })

    sock.on(`task:${taskId}:progress`, (data: TaskProgress) => {
      progress.value = data
    })

    sock.on(`task:${taskId}:error`, (data: { message: string }) => {
      error.value = data.message
    })

    sock.on('connect', () => {
      connected.value = true
      sock.emit('subscribe:task', { taskId })
    })

    sock.on('disconnect', () => {
      connected.value = false
    })
  }

  function disconnect() {
    sock.emit('unsubscribe:task', { taskId })
    sock.off(`task:${taskId}:progress`)
    sock.off(`task:${taskId}:error`)
  }

  connect()

  onUnmounted(() => {
    disconnect()
  })

  return { progress, error, connected, disconnect }
}
