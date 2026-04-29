import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import modules from './moduleRegistry'
import { Zap } from 'lucide-react'
import './App.css'

function Sidebar() {
  const location = useLocation()
  const activeModules = modules.filter(m => m.enabled)

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><Zap size={18} /></div>
        <span className="logo-text">MailFlow</span>
      </div>

      <nav className="sidebar-nav">
        {activeModules.map(mod => {
          const Icon = mod.icon
          const isActive = location.pathname.startsWith(mod.path)
          return (
            <NavLink
              key={mod.id}
              to={mod.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{mod.label}</span>
              {isActive && <div className="nav-indicator" />}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="version-tag">v1.0 · Live</div>
      </div>
    </aside>
  )
}

function AppShell() {
  const activeModules = modules.filter(m => m.enabled)
  const defaultPath = activeModules[0]?.path || '/settings'

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          {activeModules.map(mod => (
            <Route
              key={mod.id}
              path={`${mod.path}/*`}
              element={<mod.component />}
            />
          ))}
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181f',
            color: '#f0f0f5',
            border: '1px solid #ffffff12',
            borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#18181f' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#18181f' } },
        }}
      />
      <AppShell />
    </BrowserRouter>
  )
}
