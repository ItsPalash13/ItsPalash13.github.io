import { useEffect, useState } from 'react'
import './App.css'
import Player from './Player'

const MESSAGES = [
  'Hello, World!',
  'नमस्ते दुनिया!',
  '¡Hola Mundo!',
  'Bonjour le monde !',
  '你好，世界',
  
]

function App() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isVideoReady, setIsVideoReady] = useState(false)
  const email = 'palashvishwas@gmail.com'

  useEffect(() => {
    const currentMessage = MESSAGES[messageIndex]
    let timeoutMs = 90

    if (!isDeleting && charIndex < currentMessage.length) {
      timeoutMs = 90
    } else if (!isDeleting && charIndex === currentMessage.length) {
      timeoutMs = 2000
    } else if (isDeleting && charIndex > 0) {
      timeoutMs = 45
    } else {
      timeoutMs = 350
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && charIndex < currentMessage.length) {
        setCharIndex((value) => value + 1)
        return
      }

      if (!isDeleting && charIndex === currentMessage.length) {
        setIsDeleting(true)
        return
      }

      if (isDeleting && charIndex > 0) {
        setCharIndex((value) => value - 1)
        return
      }

      setIsDeleting(false)
      setMessageIndex((value) => (value + 1) % MESSAGES.length)
    }, timeoutMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [charIndex, isDeleting, messageIndex])

  const visibleText = MESSAGES[messageIndex].slice(0, charIndex)
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setToastMessage('Email copied')
      window.setTimeout(() => {
        setToastMessage('')
      }, 1800)
    } catch {
      setToastMessage('Copy failed')
      window.setTimeout(() => {
        setToastMessage('')
      }, 1800)
    }
  }

  return (
    <main className="page">
      <Player onFirstFrame={() => setIsVideoReady(true)} />
      <div className="overlay" />
      <p className="top-left-name">Palash Krishna Vishwas.</p>
      <h1 className="typewriter">
        <span>{visibleText}</span>
        <span className="cursor" aria-hidden="true">
          |
        </span>
      </h1>
      <div className="bottom-right-email">
        <button
          type="button"
          className="email-button"
          onClick={handleCopyEmail}
          aria-label="Copy email address"
        >
          <svg
            className="email-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"
            />
          </svg>
        </button>
      </div>
      {toastMessage ? (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
      {!isVideoReady ? (
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="loader" aria-hidden="true" />
        </div>
      ) : null}
    </main>
  )
}

export default App
