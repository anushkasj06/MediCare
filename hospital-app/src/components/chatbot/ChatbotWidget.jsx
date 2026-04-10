import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { clsx } from 'clsx'
import { chatbotApi } from '../../api/reminderApi.js'

const FAQS = [
  { q: 'How do I book an appointment?' },
  { q: 'Where can I view my prescriptions?' },
  { q: 'How do medication reminders work?' },
]

export default function ChatbotWidget() {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([
    { id:1, role:'bot', text:'Hi! I\'m your CareConnect assistant. How can I help you today?', time: new Date() }
  ])
  const [input,     setInput]    = useState('')
  const [typing,    setTyping]   = useState(false)
  const [sessionId, setSessionId]= useState(null)
  const bottomRef = useRef()

  // Create chatbot session on open
  useEffect(() => {
    if (open && !sessionId) {
      chatbotApi.createSession().then(r => setSessionId(r.data.data.sessionId)).catch(() => {})
    }
  }, [open, sessionId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { id: Date.now(), role:'user', text: text.trim(), time: new Date() }
    setMessages(ms => [...ms, userMsg])
    setInput('')
    setTyping(true)

    try {
      const res = await chatbotApi.query({ sessionId, message: text.trim() })
      const reply = res.data.data.message || 'I can help with appointments, prescriptions, reminders, and more.'
      setMessages(ms => [...ms, { id: Date.now()+1, role:'bot', text: reply, time: new Date() }])
    } catch {
      setMessages(ms => [...ms, { id: Date.now()+1, role:'bot', text: 'Sorry, I\'m having trouble right now. Please try again.', time: new Date() }])
    } finally {
      setTyping(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 bg-white rounded-2xl shadow-modal border border-border flex flex-col overflow-hidden animate-fadeUp">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center"><Bot size={16} className="text-white"/></div>
              <div>
                <p className="text-sm font-semibold text-white">CareBot</p>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"/><p className="text-[10px] text-white/70">Online</p></div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors"><X size={16}/></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
            {messages.map(msg => (
              <div key={msg.id} className={clsx('flex gap-2', msg.role==='user' && 'flex-row-reverse')}>
                <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  msg.role==='bot' ? 'bg-primary-soft text-primary' : 'bg-accent text-white')}>
                  {msg.role==='bot' ? <Bot size={12}/> : <User size={12}/>}
                </div>
                <div className={clsx('max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                  msg.role==='bot' ? 'bg-surface-2 text-text rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm')}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0"><Bot size={12} className="text-primary"/></div>
                <div className="bg-surface-2 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-light animate-pulse2" style={{animationDelay:`${i*0.15}s`}} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
            {FAQS.slice(0,3).map(f => (
              <button key={f.q} onClick={() => sendMessage(f.q)}
                className="text-[10px] bg-surface-2 hover:bg-primary-soft text-text-muted hover:text-primary rounded-full px-2.5 py-1 transition-colors border border-border">
                {f.q.replace('How do I ','').slice(0,20)}…
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              className="flex-1 text-xs bg-surface-2 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-light transition-colors disabled:opacity-40">
              <Send size={13}/>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-glow hover:bg-primary-light transition-all hover:scale-105 active:scale-95"
      >
        {open ? <X size={20}/> : <MessageCircle size={20}/>}
      </button>
    </>
  )
}
