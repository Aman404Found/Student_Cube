import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Loader from './components/Loader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Loader>
      <App />
    </Loader>
  </StrictMode>,
)
