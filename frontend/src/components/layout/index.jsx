import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, Calendar, FileText, Clock, Bell, User, Settings,
  Users, ShieldCheck, BarChart2, FileSearch, LogOut, Menu, X,
  Stethoscope, ClipboardList, UserCheck, Sliders, ChevronRight,
  Heart, Activity, Sun, Moon,
} from 'lucide-react'
import { clsx } from 'clsx'
import { logout } from '../../context/authSlice.js'
import { toggleSidebar, toggleTheme } from '../../context/uiSlice.js'
import { Avatar, NotificationBell } from '../common/index.jsx'

// ── Nav configs per role ──────────────────────────────────────
const patientNav = [
  { label: 'Dashboard',      icon: <LayoutDashboard size={17}/>, to: '/patient/dashboard' },
  { label: 'Appointments',   icon: <Calendar size={17}/>,        to: '/patient/appointments' },
  { label: 'Prescriptions',  icon: <FileText size={17}/>,        to: '/patient/prescriptions' },
  { label: 'Medical History',icon: <ClipboardList size={17}/>,   to: '/patient/medical-history' },
  { label: 'Reminders',      icon: <Clock size={17}/>,           to: '/patient/reminders' },
  { label: 'Notifications',  icon: <Bell size={17}/>,            to: '/patient/notifications' },
  { label: 'Profile',        icon: <User size={17}/>,            to: '/patient/profile' },
]

const doctorNav = [
  { label: 'Dashboard',      icon: <LayoutDashboard size={17}/>, to: '/doctor/dashboard' },
  { label: 'Appointments',   icon: <Calendar size={17}/>,        to: '/doctor/appointments' },
  { label: 'Availability',   icon: <Sliders size={17}/>,         to: '/doctor/availability' },
  { label: 'Prescriptions',  icon: <FileText size={17}/>,        to: '/doctor/prescriptions/new' },
  { label: 'Medical Records',icon: <ClipboardList size={17}/>,   to: '/doctor/medical-records/new' },
  { label: 'Verification',   icon: <ShieldCheck size={17}/>,     to: '/doctor/verification' },
  { label: 'Profile',        icon: <User size={17}/>,            to: '/doctor/profile' },
]

const adminNav = [
  { label: 'Dashboard',      icon: <LayoutDashboard size={17}/>, to: '/admin/dashboard' },
  { label: 'Pending Doctors',icon: <UserCheck size={17}/>,       to: '/admin/doctors/pending' },
  { label: 'Users',          icon: <Users size={17}/>,           to: '/admin/users' },
  { label: 'Reports',        icon: <BarChart2 size={17}/>,       to: '/admin/reports' },
  { label: 'Logs',           icon: <FileSearch size={17}/>,      to: '/admin/logs' },
  { label: 'Settings',       icon: <Settings size={17}/>,        to: '/admin/settings' },
]

// ── Theme Toggle Button ───────────────────────────────────────
export const ThemeToggle = ({ compact = false }) => {
  const dispatch = useDispatch()
  const theme    = useSelector(s => s.ui.theme)
  const isDark   = theme === 'dark'

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="theme-btn"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark
        ? <><Sun size={13} />{!compact && 'Light'}</>
        : <><Moon size={13} />{!compact && 'Dark'}</>
      }
    </button>
  )
}

// ── Sidebar ───────────────────────────────────────────────────
const Sidebar = ({ nav, role }) => {
  const location  = useLocation()
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const open      = useSelector(s => s.ui.sidebarOpen)
  const user      = useSelector(s => s.auth.user)

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const roleColor = {
    patient: 'bg-[var(--pri)]',
    doctor:  'bg-[var(--acc)]',
    admin:   'bg-[var(--warn)]',
  }[role] || 'bg-[var(--pri)]'

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" onClick={() => dispatch(toggleSidebar())} />}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300',
          open ? 'w-60' : 'w-16',
          'lg:relative lg:translate-x-0',
          !open && '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', roleColor)}>
            <Heart size={15} className="text-white" fill="white" />
          </div>
          {open && (
            <div>
              <p className="font-display text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>CareConnect</p>
              <p className="text-[10px] capitalize mt-0.5" style={{ color: 'var(--text-light)' }}>{role} portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {nav.map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx('sidebar-link', active && 'active', !open && 'justify-center px-2')}
                title={!open ? item.label : ''}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {open && <span className="truncate">{item.label}</span>}
                {open && active && <ChevronRight size={12} className="ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle in sidebar */}
        {open && (
          <div className="px-3 pb-2">
            <ThemeToggle />
          </div>
        )}

        {/* User footer */}
        <div
          className={clsx('p-3 flex items-center gap-3', !open && 'justify-center')}
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Avatar src={user?.profilePicture} name={user?.fullName} size="sm" />
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.fullName}</p>
                <p className="text-[10px] capitalize" style={{ color: 'var(--text-light)' }}>{role}</p>
              </div>
              <button onClick={handleLogout} className="p-1 rounded-lg transition-colors hover:bg-[var(--danger-soft)]" style={{ color: 'var(--text-light)' }}>
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

// ── Topbar ────────────────────────────────────────────────────
const Topbar = ({ title }) => {
  const dispatch      = useDispatch()
  const navigate      = useNavigate()
  const user          = useSelector(s => s.auth.user)
  const role          = useSelector(s => s.auth.role)
  const notifications = useSelector(s => s.patient?.notifications || [])
  const unread        = notifications.filter(n => !n.read).length
  const profileTarget = role === 'admin' ? '/admin/settings' : `/${role}/profile`

  return (
    <header
      className="sticky top-0 z-20 px-5 py-3 flex items-center gap-4 backdrop-blur-sm"
      style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)' }}
    >
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-2 rounded-xl transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <Menu size={18} />
      </button>

      <div className="flex-1">
        <h1 className="font-display text-lg font-semibold" style={{ color: 'var(--text)' }}>{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {role === 'patient' && <NotificationBell count={unread} onClick={() => navigate('/patient/notifications')} />}
        <button
          onClick={() => navigate(profileTarget)}
          className="p-1.5 rounded-xl transition-colors hover:bg-[var(--pri-soft)]"
        >
          <Avatar src={user?.profilePicture} name={user?.fullName} size="sm" />
        </button>
      </div>
    </header>
  )
}

// ── PUBLIC LAYOUT ─────────────────────────────────────────────
export const PublicLayout = () => {
  const navigate     = useNavigate()
  const location     = useLocation()
  const dispatch     = useDispatch()
  const theme        = useSelector(s => s.ui.theme)
  const [mobileMenu, setMobileMenu] = useState(false)

  const links = [
    { label: 'Home',    to: '/' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'About',   to: '/about' },
    { label: 'FAQ',     to: '/faq' },
    { label: 'Contact', to: '/contact' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <nav
        className="sticky top-0 z-50 px-5 py-3.5 flex items-center justify-between backdrop-blur-md"
        style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--pri)' }}>
            <Heart size={15} className="text-white" fill="white" />
          </div>
          <span className="font-display text-lg font-bold" style={{ color: 'var(--pri)' }}>CareConnect</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                color: location.pathname === l.to ? 'var(--pri)' : 'var(--text-muted)',
                background: location.pathname === l.to ? 'var(--pri-soft)' : 'transparent',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => navigate('/login')} className="btn-secondary text-sm">Login</button>
          <button onClick={() => navigate('/select-role')} className="btn-primary text-sm">Get Started</button>
        </div>

        <button
          className="md:hidden p-2 rounded-xl"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </nav>

      {mobileMenu && (
        <div className="md:hidden px-5 py-3 space-y-1" style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className="sidebar-link" onClick={() => setMobileMenu(false)}>{l.label}</Link>
          ))}
          <div className="flex gap-2 pt-2">
            <ThemeToggle />
            <button onClick={() => navigate('/login')} className="btn-secondary flex-1 text-sm">Login</button>
            <button onClick={() => navigate('/select-role')} className="btn-primary flex-1 text-sm">Register</button>
          </div>
        </div>
      )}

      <main className="flex-1"><Outlet /></main>

      <footer className="py-10 mt-auto" style={{ background: 'var(--pri)' }}>
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart size={15} className="text-white" fill="white" />
              </div>
              <span className="font-display text-lg font-bold text-white">CareConnect</span>
            </div>
            <p className="text-sm text-white/60">© 2026 CareConnect. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-white/60">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── AUTH LAYOUT ───────────────────────────────────────────────
export const AuthLayout = () => {
  const dispatch = useDispatch()
  const theme    = useSelector(s => s.ui.theme)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'var(--pri)' }}
      >
        {/* Decorative rings */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{width:`${(i+1)*120}px`,height:`${(i+1)*120}px`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}
            />
          ))}
        </div>
        {/* Floating circles */}
        <div className="absolute top-20 right-10 w-24 h-24 rounded-full bg-white/5 animate-float" />
        <div className="absolute bottom-32 right-20 w-16 h-16 rounded-full bg-white/8" style={{ animationDelay:'1s' }} />

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Heart size={18} className="text-white" fill="white" />
          </div>
          <span className="font-display text-xl font-bold text-white">CareConnect</span>
        </Link>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse2" />
            Trusted by 10,000+ patients
          </div>
          <h2 className="font-display text-3xl font-bold text-white leading-tight mb-3">
            Your health,<br/>our priority.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Book appointments, manage prescriptions, and track your medical history — all in one secure platform.
          </p>
        </div>

        <div className="relative z-10 flex gap-6">
          {[['10K+','Patients'],['500+','Doctors'],['50K+','Appointments']].map(([v,l]) => (
            <div key={l}>
              <p className="font-display text-xl font-bold text-white">{v}</p>
              <p className="text-xs text-white/60">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--bg3)' }}>
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--pri)' }}>
                <Heart size={15} className="text-white" fill="white" />
              </div>
              <span className="font-display text-lg font-bold" style={{ color: 'var(--pri)' }}>CareConnect</span>
            </Link>
            <ThemeToggle compact />
          </div>
          <div className="hidden lg:flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD LAYOUT ──────────────────────────────────────────
const getTitleFromPath = (path) => {
  const map = {
    '/patient/dashboard':       'Dashboard',
    '/patient/appointments':    'My Appointments',
    '/patient/appointments/book':'Book Appointment',
    '/patient/prescriptions':   'Prescriptions',
    '/patient/medical-history': 'Medical History',
    '/patient/reminders':       'Reminders',
    '/patient/notifications':   'Notifications',
    '/patient/profile':         'My Profile',
    '/doctor/dashboard':        'Dashboard',
    '/doctor/appointments':     'Appointments',
    '/doctor/availability':     'Manage Availability',
    '/doctor/profile':          'My Profile',
    '/doctor/verification':     'Verification Status',
    '/doctor/prescriptions/new':'Upload Prescription',
    '/doctor/medical-records/new':'Add Medical Record',
    '/admin/dashboard':         'Admin Dashboard',
    '/admin/doctors/pending':   'Doctor Verification Queue',
    '/admin/users':             'User Management',
    '/admin/reports':           'Reports',
    '/admin/logs':              'System Logs',
    '/admin/settings':          'Settings',
  }
  return map[path] || 'CareConnect'
}

export const DashboardLayout = ({ role }) => {
  const authRole = useSelector(s => s.auth.role)
  const location = useLocation()
  const title    = getTitleFromPath(location.pathname)
  const activeRole = role || authRole
  const nav = activeRole === 'patient' ? patientNav : activeRole === 'doctor' ? doctorNav : adminNav

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar nav={nav} role={activeRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-5">
          <Outlet />
        </main>
        <MobileBottomNav nav={nav} />
      </div>
    </div>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────
export const MobileBottomNav = ({ nav }) => {
  const location = useLocation()
  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
      style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border)' }}
    >
      {nav.slice(0, 5).map(item => {
        const active = location.pathname.startsWith(item.to)
        return (
          <Link key={item.to} to={item.to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors"
            style={{ color: active ? 'var(--pri)' : 'var(--text-light)' }}
          >
            {item.icon}
            {item.label.split(' ')[0]}
          </Link>
        )
      })}
    </div>
  )
}
