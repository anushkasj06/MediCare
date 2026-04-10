import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import AppRoutes from './routes/AppRoutes.jsx'
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx'

export default function App() {
  const { isAuthenticated, role } = useSelector(s => s.auth)
  const theme = useSelector(s => s.ui.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <>
      <AppRoutes />
      {isAuthenticated && role === 'patient' && <ChatbotWidget />}
    </>
  )
}
