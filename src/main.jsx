import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
 
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface-soft, #1a1a22)',
            color: 'var(--text-primary, #fff)',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: { iconTheme: { primary: 'var(--accent, #fb923c)' } },
          error: { iconTheme: { primary: '#ef4444' } },
        }}
      />
    </Provider>
 
)
