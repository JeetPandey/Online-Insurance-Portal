import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 4000, success: { iconTheme: { primary: '#16804a', secondary: '#fff' } }, error: { duration: 5500 } }} />
  </StrictMode>,
)
