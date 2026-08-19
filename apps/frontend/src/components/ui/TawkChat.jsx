import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function TawkChat() {
  const location = useLocation()

  useEffect(() => {
    // 1. Inject the Tawk.to script dynamically if not already present
    const existingScript = document.getElementById('tawk-script')
    if (!existingScript) {
      window.Tawk_API = window.Tawk_API || {}
      window.Tawk_LoadStart = new Date()

      const s1 = document.createElement('script')
      const s0 = document.getElementsByTagName('script')[0]
      s1.id = 'tawk-script'
      s1.async = true
      s1.src = 'https://embed.tawk.to/6a832fae27f5991d51f5f721/default'
      s1.charset = 'UTF-8'
      s1.setAttribute('crossorigin', '*')
      
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0)
      } else {
        document.head.appendChild(s1)
      }
    }
  }, [])

  // 2. React to path change to show/hide the widget based on admin routing
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin')

    const updateWidgetVisibility = () => {
      if (
        window.Tawk_API &&
        typeof window.Tawk_API.hideWidget === 'function' &&
        typeof window.Tawk_API.showWidget === 'function'
      ) {
        try {
          if (isAdminRoute) {
            window.Tawk_API.hideWidget()
          } else {
            window.Tawk_API.showWidget()
          }
          return true // Successfully updated
        } catch (e) {
          return false
        }
      }
      return false
    }

    // Try executing immediately
    const success = updateWidgetVisibility()
    if (!success) {
      // If Tawk.to is still downloading/initializing, poll every 200ms for up to 5 seconds
      let attempts = 0
      const timer = setInterval(() => {
        attempts++
        const done = updateWidgetVisibility()
        if (done || attempts > 25) {
          clearInterval(timer)
        }
      }, 200)
      return () => clearInterval(timer)
    }
  }, [location.pathname])

  return null
}
