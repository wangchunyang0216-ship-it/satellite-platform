/**
 * AI 教程助手 — API 层
 */
import request from './request'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const aiApi = {
  /** 检查 AI 服务状态 */
  getStatus() {
    return request.get('/ai/status')
  },

  /** 获取推荐问题 */
  getSuggestions() {
    return request.get('/ai/suggestions')
  },

  /** 发送消息（非流式） */
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<string> {
    const res = await request.post('/ai/chat', { message, history })
    const data = res.data as any
    return data?.data?.reply || data?.reply || 'AI 服务暂不可用'
  },

  /** 流式发送消息 — 返回 ReadableStream reader */
  async sendMessageStream(
    message: string,
    history: ChatMessage[] = [],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): Promise<void> {
    const token = localStorage.getItem('token')
    const base = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1'

    try {
      const response = await fetch(`${base}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, history }),
      })

      if (!response.ok) {
        onError(`HTTP ${response.status}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        onError('无法读取响应流')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onDone()
              return
            }
            if (data.startsWith('[ERROR]')) {
              onError(data.slice(8))
              return
            }
            onToken(data)
          }
        }
      }
      onDone()
    } catch (err: any) {
      onError(err.message || '网络错误')
    }
  },
}
