<template>
  <div class="ai-assistant" :class="{ open: isOpen, minimized: isMinimized }">
    <!-- 浮动触发按钮 -->
    <div class="ai-trigger" @click="toggle" v-show="!isOpen">
      <div class="ai-trigger-icon">
        <el-icon :size="22"><ChatDotRound /></el-icon>
      </div>
      <span class="ai-trigger-badge" v-if="unreadCount">{{ unreadCount }}</span>
      <div class="ai-trigger-pulse"></div>
    </div>

    <!-- 聊天窗口 -->
    <div class="ai-panel" v-show="isOpen && !isMinimized">
      <!-- 头部 -->
      <div class="ai-header">
        <div class="ai-header-left">
          <el-icon :size="18" color="#2563EB"><Cpu /></el-icon>
          <span>AI 教程助手</span>
          <span class="ai-mode-tag" :class="aiMode">{{ aiMode === 'llm' ? 'AI' : '教程' }}</span>
        </div>
        <div class="ai-header-right">
          <el-button link @click="isMinimized = true" title="最小化">
            <el-icon :size="16"><Minus /></el-icon>
          </el-button>
          <el-button link @click="close" title="关闭">
            <el-icon :size="16"><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="ai-messages" ref="msgContainer">
        <!-- 欢迎消息 / 推荐问题 -->
        <div v-if="messages.length === 0" class="ai-welcome">
          <div class="ai-welcome-icon">
            <el-icon :size="32"><Cpu /></el-icon>
          </div>
          <h4>你好，我是 AI 教程助手</h4>
          <p>我可以帮你快速上手遥感卫星数据平台，试着问我：</p>
          <div class="ai-suggestions">
            <div
              v-for="q in suggestions"
              :key="q"
              class="ai-suggestion-chip"
              @click="send(q)"
            >{{ q }}</div>
          </div>
        </div>

        <!-- 对话消息 -->
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="ai-msg"
          :class="msg.role"
        >
          <div class="ai-msg-avatar">
            <el-icon v-if="msg.role === 'assistant'" :size="16" color="#2563EB"><Cpu /></el-icon>
            <el-icon v-else :size="16" color="#6B7280"><User /></el-icon>
          </div>
          <div class="ai-msg-bubble" v-html="renderMarkdown(msg.content)"></div>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="ai-msg assistant">
          <div class="ai-msg-avatar">
            <el-icon :size="16" color="#2563EB"><Cpu /></el-icon>
          </div>
          <div class="ai-msg-bubble typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="ai-input">
        <el-input
          v-model="input"
          placeholder="输入你的问题..."
          @keyup.enter="send(input)"
          :disabled="loading"
          size="default"
          class="ai-input-field"
        >
          <template #suffix>
            <el-button
              link
              type="primary"
              :disabled="!input.trim() || loading"
              @click="send(input)"
            >
              <el-icon :size="18"><Promotion /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 最小化条 -->
    <div class="ai-mini-bar" v-show="isOpen && isMinimized" @click="isMinimized = false">
      <el-icon :size="18" color="#2563EB"><Cpu /></el-icon>
      <span>AI 教程助手</span>
      <el-button link @click.stop="close" style="margin-left:auto">
        <el-icon :size="14"><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { ChatDotRound, Cpu, Minus, Close, User, Promotion } from '@element-plus/icons-vue'
import { aiApi, type ChatMessage } from '@/api/ai'

const isOpen = ref(false)
const isMinimized = ref(false)
const loading = ref(false)
const input = ref('')
const messages = ref<Array<{ role: string; content: string }>>([])
const msgContainer = ref<HTMLElement>()
const unreadCount = ref(0)
const suggestions = ref<string[]>([
  '如何检索卫星数据？',
  '怎么计算 NDVI 植被指数？',
  '如何查看我的计算任务进度？',
  '新用户第一步该做什么？',
])
const aiMode = ref('教程')

// 从后端加载推荐问题
onMounted(async () => {
  try {
    const statusRes = await aiApi.getStatus()
    aiMode.value = (statusRes.data as any)?.data?.mode || '教程'
  } catch { /* 后端未启动时使用默认 */ }

  try {
    const sugRes = await aiApi.getSuggestions()
    if ((sugRes.data as any)?.data?.suggestions?.length) {
      suggestions.value = (sugRes.data as any).data.suggestions
    }
  } catch { /* 使用默认推荐 */ }
})

function toggle() {
  isOpen.value = true
  isMinimized.value = false
  unreadCount.value = 0
}

function close() {
  isOpen.value = false
  isMinimized.value = false
}

function scrollToBottom() {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
}

async function send(text: string) {
  const msg = text.trim()
  if (!msg || loading.value) return

  input.value = ''
  messages.value.push({ role: 'user', content: msg })
  loading.value = true
  scrollToBottom()

  try {
    // 构建历史消息
    const history: ChatMessage[] = messages.value
      .slice(0, -1)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // 使用流式响应
    let replyContent = ''
    messages.value.push({ role: 'assistant', content: '' })
    const replyIndex = messages.value.length - 1
    scrollToBottom()

    await aiApi.sendMessageStream(
      msg,
      history,
      (token: string) => {
        replyContent += token
        messages.value[replyIndex].content = replyContent
        scrollToBottom()
      },
      () => {
        loading.value = false
      },
      async (err: string) => {
        // 流式失败，回退到非流式
        console.warn('流式失败，回退非流式:', err)
        try {
          const reply = await aiApi.sendMessage(msg, history)
          messages.value[replyIndex].content = reply
        } catch {
          messages.value[replyIndex].content = '抱歉，AI 服务暂不可用。请检查后端服务是否启动。'
        }
        loading.value = false
      }
    )
  } catch {
    // 所有方式都失败，回退到简单请求
    try {
      const history: ChatMessage[] = messages.value
        .slice(0, -1)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      const reply = await aiApi.sendMessage(msg, history)
      messages.value.push({ role: 'assistant', content: reply })
    } catch {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，AI 服务暂不可用。请确保后端服务已启动（`cd backend && python main.py`）。\n\n内置教程模式无需配置 API Key，重启后端即可使用。'
      })
    }
    loading.value = false
    scrollToBottom()
  }
}

// 简单的 Markdown 渲染
function renderMarkdown(text: string): string {
  if (!text) return ''
  return text
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="md-code"><code>$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code class="md-inline">$1</code>')
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 标题
    .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    // 引用
    .replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>')
    // 无序列表
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')
    // 换行
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ═══ 触发按钮 ═══ */
.ai-trigger {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563EB, #4F46E5);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.25s;
  color: #fff;
}
.ai-trigger:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(37, 99, 235, 0.45);
}
.ai-trigger-icon { position: relative; z-index: 1; }
.ai-trigger-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 20px; height: 20px; border-radius: 10px;
  background: #EF4444; color: #fff; font-size: 13px;
  font-weight: 700; display: flex; align-items: center;
  justify-content: center; padding: 0 6px; z-index: 2;
}
.ai-trigger-pulse {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid rgba(37, 99, 235, 0.3);
  animation: aiPulse 2s infinite;
}
@keyframes aiPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0; }
}

/* ═══ 聊天面板 ═══ */
.ai-panel {
  position: absolute;
  bottom: 64px;
  right: 0;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #E5E7EB;
}

/* 头部 */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F3F4F6;
  flex-shrink: 0;
}
.ai-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}
.ai-mode-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
}
.ai-mode-tag.llm { background: rgba(37, 99, 235, 0.08); color: #2563EB; }
.ai-mode-tag.教程 { background: rgba(5, 150, 105, 0.08); color: #059669; }
.ai-header-right { display: flex; gap: 4px; }

/* 消息区 */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}
.ai-messages::-webkit-scrollbar { width: 4px; }
.ai-messages::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }

/* 欢迎区 */
.ai-welcome { text-align: center; padding: 32px 8px; }
.ai-welcome-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(79,70,229,0.06));
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px; color: #2563EB;
}
.ai-welcome h4 { font-size: 18px; font-weight: 700; color: #1F2937; margin: 0 0 8px; }
.ai-welcome p { font-size: 15px; color: #6B7280; margin: 0 0 16px; }
.ai-suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.ai-suggestion-chip {
  padding: 7px 14px; font-size: 14px; color: #2563EB;
  background: rgba(37, 99, 235, 0.04); border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 16px; cursor: pointer; transition: all 0.15s;
}
.ai-suggestion-chip:hover { background: rgba(37, 99, 235, 0.08); border-color: #2563EB; }

/* 消息气泡 */
.ai-msg { display: flex; gap: 8px; }
.ai-msg.user { flex-direction: row-reverse; }
.ai-msg-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #F3F4F6; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.ai-msg.user .ai-msg-avatar { background: rgba(37, 99, 235, 0.08); }
.ai-msg-bubble {
  max-width: 82%; padding: 10px 14px; border-radius: 14px;
  font-size: 15px; line-height: 1.65; color: #1F2937;
  word-break: break-word;
}
.ai-msg.assistant .ai-msg-bubble { background: #F3F4F6; border-bottom-left-radius: 4px; }
.ai-msg.user .ai-msg-bubble {
  background: linear-gradient(135deg, #2563EB, #4F46E5);
  color: #fff; border-bottom-right-radius: 4px;
}

/* 打字动画 */
.ai-msg-bubble.typing { display: flex; gap: 5px; align-items: center; padding: 14px 18px; }
.ai-msg-bubble.typing .dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #9CA3AF; animation: dotBounce 1.4s infinite;
}
.ai-msg-bubble.typing .dot:nth-child(2) { animation-delay: 0.2s; }
.ai-msg-bubble.typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Markdown 渲染样式 */
.ai-msg-bubble :deep(.md-code) {
  background: #1F2937; color: #E5E7EB; padding: 10px 14px;
  border-radius: 8px; font-size: 14px; line-height: 1.55;
  overflow-x: auto; margin: 6px 0;
}
.ai-msg.user .ai-msg-bubble :deep(.md-code) {
  background: rgba(255,255,255,0.15); color: #fff;
}
.ai-msg-bubble :deep(.md-inline) {
  background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 3px;
  font-size: 14px; font-family: 'Consolas', monospace;
}
.ai-msg.user .ai-msg-bubble :deep(.md-inline) {
  background: rgba(255,255,255,0.2);
}
.ai-msg-bubble :deep(strong) { font-weight: 600; color: #111827; }
.ai-msg.user .ai-msg-bubble :deep(strong) { color: #fff; }
.ai-msg-bubble :deep(.md-h3) { font-size: 17px; font-weight: 700; margin: 8px 0 4px; }
.ai-msg-bubble :deep(.md-h4) { font-size: 16px; font-weight: 600; margin: 6px 0 2px; }
.ai-msg-bubble :deep(.md-quote) {
  border-left: 3px solid #2563EB; padding: 4px 10px;
  color: #6B7280; margin: 6px 0; font-size: 14px;
}
.ai-msg.user .ai-msg-bubble :deep(.md-quote) {
  border-left-color: rgba(255,255,255,0.5); color: rgba(255,255,255,0.8);
}
.ai-msg-bubble :deep(.md-li) {
  margin: 2px 0; padding-left: 8px;
}

/* 输入区 */
.ai-input {
  padding: 12px 16px;
  border-top: 1px solid #F3F4F6;
  flex-shrink: 0;
}
.ai-input-field :deep(.el-input__wrapper) {
  border-radius: 20px !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
  border: 1px solid #E5E7EB !important;
}

/* 最小化条 */
.ai-mini-bar {
  position: absolute; bottom: 64px; right: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: #fff; border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08); cursor: pointer;
  font-size: 15px; font-weight: 600; color: #1F2937;
  border: 1px solid #E5E7EB; min-width: 200px;
}
</style>
