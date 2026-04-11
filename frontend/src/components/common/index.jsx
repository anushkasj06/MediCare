import React, { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, ChevronLeft, ChevronRight, Search, Upload, Check, AlertCircle, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { getInitials } from '../../utils/index.js'

// ── Button ────────────────────────────────────────────────────
export const Button = ({ children, variant='primary', size='md', loading=false, icon, className='', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-light active:scale-[0.98] shadow-sm',
    secondary: 'bg-white text-primary border border-border hover:bg-surface-2',
    accent:    'bg-accent text-white hover:bg-accent-light shadow-sm',
    danger:    'bg-danger text-white hover:bg-red-600',
    error:     'bg-danger text-white hover:bg-red-600',
    ghost:     'text-text-muted hover:bg-surface-2 hover:text-primary',
    outline:   'border border-primary text-primary hover:bg-primary-soft',
    success:   'bg-success text-white hover:brightness-110',
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-5 py-2.5', lg: 'text-base px-6 py-3' }
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────
export const Input = ({ label, error, hint, icon, className='', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-text-muted font-body">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">{icon}</span>}
      <input
        className={clsx('input-base', icon && 'pl-9', error && 'border-danger focus:ring-danger/20', className)}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-danger flex items-center gap-1"><AlertCircle size={11}/>{error}</span>}
    {hint && !error && <span className="text-xs text-text-light">{hint}</span>}
  </div>
)

// ── Select ────────────────────────────────────────────────────
export const Select = ({ label, error, options=[], className='', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-text-muted font-body">{label}</label>}
    <div className="relative">
      <select className={clsx('input-base appearance-none pr-9', error && 'border-danger', className)} {...props}>
        <option value="">Select…</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
    </div>
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
)

// ── TextArea ──────────────────────────────────────────────────
export const TextArea = ({ label, error, rows=4, className='', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-text-muted font-body">{label}</label>}
    <textarea
      rows={rows}
      className={clsx('input-base resize-none', error && 'border-danger', className)}
      {...props}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
)

// ── Modal ─────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size='md', footer }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-modal w-full animate-fadeUp', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="text-text-light hover:text-text transition-colors p-1 rounded-lg hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border bg-surface-2 rounded-b-2xl flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────
export const Drawer = ({ open, onClose, title, children, side='right' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative bg-white shadow-modal w-full max-w-md flex flex-col',
        side === 'right' ? 'ml-auto animate-slideIn' : 'mr-auto'
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="text-text-light hover:text-text p-1 rounded-lg hover:bg-surface-2"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export const Badge = ({ children, variant='primary', dot=false }) => {
  const variants = {
    primary: 'badge-primary', success: 'badge-success',
    warning: 'badge-warning', danger: 'badge-danger', accent: 'badge-accent',
  }
  return (
    <span className={clsx(variants[variant] || variants.primary)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />}
      {children}
    </span>
  )
}

// ── Table ─────────────────────────────────────────────────────
export const Table = ({ columns=[], data=[], loading=false, emptyText='No records found', emptyState, onRowClick }) => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full text-sm font-body">
      <thead>
        <tr className="bg-surface-2 border-b border-border">
          {columns.map(c => (
            <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3">
                  <div className="h-4 rounded shimmer-bg" />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">{emptyState || emptyText}</td></tr>
        ) : (
          data.map((row, i) => (
            <tr
              key={row._id || i}
              onClick={() => onRowClick?.(row)}
              className={clsx('border-b border-border last:border-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-primary-soft/40')}
            >
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-text">
                  {c.render
                    ? (row[c.key] === undefined && c.render.length <= 1
                      ? c.render(row)
                      : c.render(row[c.key], row))
                    : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

// ── Pagination ────────────────────────────────────────────────
export const Pagination = ({ page, total, limit=10, onChange }) => {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm font-body text-text-muted">
      <span>Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page-1)} disabled={page===1}
          className="p-1.5 rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={16}/>
        </button>
        {Array.from({length:pages},(_,i)=>i+1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={clsx('w-8 h-8 rounded-lg text-xs font-medium transition-colors',
              p===page ? 'bg-primary text-white' : 'hover:bg-surface-2')}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page+1)} disabled={page===pages}
          className="p-1.5 rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight size={16}/>
        </button>
      </div>
    </div>
  )
}

// ── Loader ────────────────────────────────────────────────────
export const Loader = ({ size='md', className='' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx('border-2 border-border border-t-primary rounded-full animate-spin', sizes[size])} />
    </div>
  )
}

// ── PageLoader ────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-text-muted font-body">Loading…</p>
    </div>
  </div>
)

// ── EmptyState ────────────────────────────────────────────────
export const EmptyState = ({ icon, title='Nothing here yet', message, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="w-14 h-14 bg-surface-3 rounded-2xl flex items-center justify-center text-text-light mb-4">{icon}</div>}
    <h4 className="font-display text-base font-semibold text-text mb-1">{message || title}</h4>
    {description && <p className="text-sm text-text-muted max-w-xs mb-4">{description}</p>}
    {action && typeof action === 'object'
      ? <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      : action}
  </div>
)

// ── ErrorState ────────────────────────────────────────────────
export const ErrorState = ({ message='Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-danger-soft rounded-2xl flex items-center justify-center text-danger mb-4">
      <AlertCircle size={24} />
    </div>
    <h4 className="font-display text-base font-semibold text-text mb-1">Error</h4>
    <p className="text-sm text-text-muted mb-4">{message}</p>
    {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try Again</Button>}
  </div>
)

// ── ConfirmDialog ─────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title='Are you sure?', message, confirmText='Confirm', confirmLabel, variant='danger', loading=false }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm"
    footer={<>
      <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant={variant === 'error' ? 'danger' : variant} onClick={onConfirm} loading={loading}>{confirmLabel || confirmText}</Button>
    </>}>
    <p className="text-sm text-text-muted">{message}</p>
  </Modal>
)

// ── FileUploader ──────────────────────────────────────────────
export const FileUploader = ({ label, accept, multiple=false, onChange, value, hint }) => {
  const ref = useRef()
  const [dragging, setDragging] = useState(false)
  const files = value ? (Array.isArray(value) ? value : [value]) : []
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    onChange(multiple ? dropped : dropped[0])
  }
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-text-muted font-body">{label}</label>}
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={handleDrop}
        onClick={() => ref.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          dragging ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary hover:bg-primary-soft/40'
        )}
      >
        <Upload size={20} className="mx-auto mb-2 text-text-light" />
        <p className="text-sm font-medium text-text-muted">Drop files here or <span className="text-primary">browse</span></p>
        {hint && <p className="text-xs text-text-light mt-1">{hint}</p>}
        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={e => onChange(multiple ? Array.from(e.target.files) : e.target.files[0])} />
      </div>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f,i) => (
            <div key={i} className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
              <Check size={11} className="text-success" />
              {f.name || f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SearchInput ───────────────────────────────────────────────
export const SearchInput = ({ placeholder='Search…', value, onChange, className='' }) => (
  <div className={clsx('relative', className)}>
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input-base pl-9 pr-4"
    />
  </div>
)

// ── StatusChip ────────────────────────────────────────────────
export const StatusChip = ({ status }) => {
  const map = {
    pending:   { cls: 'badge-warning',  label: 'Pending' },
    confirmed: { cls: 'badge-primary',  label: 'Confirmed' },
    completed: { cls: 'badge-success',  label: 'Completed' },
    cancelled: { cls: 'badge-danger',   label: 'Cancelled' },
    rejected:  { cls: 'badge-danger',   label: 'Rejected' },
    verified:  { cls: 'badge-success',  label: 'Verified' },
    active:    { cls: 'badge-success',  label: 'Active' },
    blocked:   { cls: 'badge-danger',   label: 'Blocked' },
    sent:      { cls: 'badge-success',  label: 'Sent' },
    failed:    { cls: 'badge-danger',   label: 'Failed' },
    scheduled: { cls: 'badge-accent',   label: 'Scheduled' },
    snoozed:   { cls: 'badge-warning',  label: 'Snoozed' },
    'no-show': { cls: 'badge-danger',   label: 'No Show' },
  }
  const { cls, label } = map[status] || { cls: 'badge-primary', label: status }
  return <span className={clsx(cls)}><span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />{label}</span>
}

// ── Avatar ────────────────────────────────────────────────────
export const Avatar = ({ src, name='', size='md', className='' }) => {
  const sizes = { xs:'w-6 h-6 text-xs', sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-base', xl:'w-20 h-20 text-xl' }
  return src ? (
    <img src={src} alt={name} className={clsx('rounded-full object-cover ring-2 ring-white', sizes[size], className)} />
  ) : (
    <div className={clsx('rounded-full bg-primary text-white flex items-center justify-center font-semibold ring-2 ring-white', sizes[size], className)}>
      {getInitials(name)}
    </div>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────
export const Breadcrumb = ({ items=[] }) => (
  <nav className="flex items-center gap-1.5 text-xs text-text-muted font-body mb-4">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight size={12} className="text-text-light" />}
        {item.href ? (
          <a href={item.href} className="hover:text-primary transition-colors">{item.label}</a>
        ) : (
          <span className={i === items.length-1 ? 'text-text font-medium' : ''}>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
)

// ── Tabs ──────────────────────────────────────────────────────
export const Tabs = ({ tabs=[], active, onChange, className='' }) => (
  <div className={clsx('flex gap-1 bg-surface-2 p-1 rounded-xl', className)}>
    {tabs.map(tab => (
      (() => {
        const value = tab.value ?? tab.id
        return (
      <button
        key={value}
        onClick={() => onChange(value)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium font-body transition-all duration-200',
          active === value
            ? 'bg-white text-primary shadow-sm'
            : 'text-text-muted hover:text-text'
        )}
      >
        {tab.icon}
        {tab.label}
        {tab.count != null && (
          <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', active === value ? 'bg-primary-soft text-primary' : 'bg-border text-text-muted')}>
            {tab.count}
          </span>
        )}
      </button>
        )
      })()
    ))}
  </div>
)

// ── StatCard ──────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, sub, color='primary', loading=false, trend }) => {
  const colors = {
    primary: 'bg-primary-soft text-primary',
    accent:  'bg-accent-soft text-accent-dark',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger:  'bg-danger-soft text-danger',
  }
  return (
    <div className="card hover:shadow-md transition-shadow duration-200 animate-fadeUp">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colors[color] || colors.primary)}>
          {icon}
        </div>
        {trend != null && (
          <span className={clsx('text-xs font-medium', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 rounded shimmer-bg" />
          <div className="h-3 w-32 rounded shimmer-bg" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-display font-bold text-text">{value}</p>
          <p className="text-xs text-text-muted font-body mt-0.5">{label}</p>
          {sub && <p className="text-xs text-text-light mt-1">{sub}</p>}
        </>
      )}
    </div>
  )
}

// ── SummaryCard ───────────────────────────────────────────────
export const SummaryCard = ({ title, children, action, className='' }) => {
  const actionNode = action && typeof action === 'object' && !React.isValidElement(action)
    ? (
      <button onClick={action.onClick} className="text-xs text-primary hover:underline">
        {action.label}
      </button>
    )
    : action

  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-text">{title}</h3>
        {actionNode}
      </div>
      {children}
    </div>
  )
}

// ── Timeline ──────────────────────────────────────────────────
export const Timeline = ({ items=[] }) => (
  <div className="relative pl-6">
    <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
    {items.map((item, i) => (
      <div key={i} className="relative mb-6 last:mb-0">
        <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-1 ring-primary/30" />
        <div className="card ml-2 p-4">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="text-sm font-semibold text-text font-body">{item.title}</p>
            <span className="text-xs text-text-light whitespace-nowrap">{item.date}</span>
          </div>
          {item.subtitle && <p className="text-xs text-text-muted mb-2">{item.subtitle}</p>}
          {item.content}
        </div>
      </div>
    ))}
  </div>
)

// ── NotificationBell ──────────────────────────────────────────
export const NotificationBell = ({ count=0, onClick }) => (
  <button onClick={onClick} className="relative p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-text transition-colors">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {count > 0 && (
      <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
)

// ── PasswordStrengthMeter ─────────────────────────────────────
export const PasswordStrengthMeter = ({ password='' }) => {
  const strength = (() => {
    let s = 0
    if (password.length >= 8)            s++
    if (/[A-Z]/.test(password))          s++
    if (/[0-9]/.test(password))          s++
    if (/[^A-Za-z0-9]/.test(password))   s++
    return s
  })()
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-danger', 'bg-warning', 'bg-accent', 'bg-success']
  if (!password) return null
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={clsx('h-1 flex-1 rounded-full transition-all duration-300', i <= strength ? colors[strength] : 'bg-border')} />
        ))}
      </div>
      <p className="text-xs text-text-muted mt-1">{labels[strength]}</p>
    </div>
  )
}

// ── FilterPanel ───────────────────────────────────────────────
export const FilterPanel = ({ filters=[], values={}, onChange, onReset }) => (
  <div className="card p-4 flex flex-wrap gap-4 items-end">
    {filters.map(f => (
      <div key={f.key} className="min-w-[140px]">
        {f.type === 'select' ? (
          <Select label={f.label} options={f.options} value={values[f.key]||''} onChange={e => onChange(f.key, e.target.value)} />
        ) : (
          <Input label={f.label} type={f.type||'text'} placeholder={f.placeholder} value={values[f.key]||''} onChange={e => onChange(f.key, e.target.value)} />
        )}
      </div>
    ))}
    <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>
  </div>
)

// ── DocumentPreviewModal ──────────────────────────────────────
export const DocumentPreviewModal = ({ open, onClose, fileUrl, title='Document' }) => (
  <Modal open={open} onClose={onClose} title={title} size="xl">
    {fileUrl ? (
      <iframe src={fileUrl} className="w-full h-[60vh] rounded-xl border border-border" title={title} />
    ) : (
      <EmptyState title="No file available" icon={<Info size={20}/>} />
    )}
  </Modal>
)
