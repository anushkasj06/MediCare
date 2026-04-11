import React, { useState } from 'react'
import { FileText, Download, Share2, Eye } from 'lucide-react'
import { Tabs, EmptyState, StatusChip, Modal } from '../../components/common/index.jsx'
import { usePatientPrescriptions } from '../../hooks/index.js'
import { prescriptionApi } from '../../api/prescriptionApi.js'
import { formatDate } from '../../utils/index.js'
import toast from 'react-hot-toast'

export default function PatientPrescriptions() {
  const [tab,       setTab]       = useState('active')
  const [preview,   setPreview]   = useState(null)
  const { data, loading } = usePatientPrescriptions()
  const prescriptions = Array.isArray(data) ? data : (data?.prescriptions || [])

  const now     = new Date()
  const active  = prescriptions.filter(p => !p.expiryDate || new Date(p.expiryDate) >= now)
  const expired = prescriptions.filter(p =>  p.expiryDate && new Date(p.expiryDate) <  now)
  const shown   = tab === 'active' ? active : expired

  const handleDownload = async (id) => {
    try {
      const res = await prescriptionApi.download(id)
      window.open(res.data.data.downloadUrl, '_blank')
    } catch { toast.error('Download failed') }
  }

  const handleShare = async (id) => {
    try {
      const res = await prescriptionApi.share(id)
      await navigator.clipboard.writeText(res.data.data.shareUrl)
      toast.success('Share link copied!')
    } catch { toast.error('Share failed') }
  }

  return (
    <div className="space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">My Prescriptions</h2>

      <Tabs tabs={[{id:'active',label:`Active (${active.length})`},{id:'expired',label:`Past (${expired.length})`}]} active={tab} onChange={setTab}/>

      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}

      {!loading && shown.length === 0 && (
        <EmptyState icon={<FileText size={28}/>} message="No prescriptions found"/>
      )}

      <div className="space-y-4">
        {shown.map(p => (
          <div key={p._id} className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-accent-dark"/>
                </div>
                <div>
                  <p className="font-semibold text-sm text-text">Prescription – {formatDate(p.uploadedAt || p.createdAt)}</p>
                  <p className="text-xs text-text-muted">By Dr. {p.doctorId?.fullName || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {p.fileUrl && <button onClick={() => setPreview(p)} className="p-2 rounded-lg hover:bg-border/50 text-text-muted hover:text-text"><Eye size={15}/></button>}
                {p.fileUrl && <button onClick={() => handleDownload(p._id)} className="p-2 rounded-lg hover:bg-border/50 text-text-muted hover:text-text"><Download size={15}/></button>}
                <button onClick={() => handleShare(p._id)} className="p-2 rounded-lg hover:bg-border/50 text-text-muted hover:text-text"><Share2 size={15}/></button>
              </div>
            </div>

            {/* Medications list */}
            {p.medications?.length > 0 && (
              <div className="bg-surface rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Medications</p>
                <div className="space-y-2">
                  {p.medications.map((m,i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"/>
                      <div>
                        <span className="text-sm font-medium text-text">{m.medicineName}</span>
                        <span className="text-xs text-text-muted ml-2">{m.dosage}{m.dosageUnit} · {m.frequencyPerDay}x/day · {m.durationDays} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.followUp?.date && (
              <div className="flex items-center gap-2 text-xs text-warning bg-warning-soft rounded-lg px-3 py-2">
                <span>📅 Follow-up on {formatDate(p.followUp.date)}</span>
                {p.followUp.notes && <span className="text-text-muted">· {p.followUp.notes}</span>}
              </div>
            )}

            {p.notes && <p className="text-xs text-text-muted border-t border-border pt-3">{p.notes}</p>}
          </div>
        ))}
      </div>

      {/* File preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Prescription Preview" size="lg">
        {preview?.fileUrl && (
          <div className="w-full" style={{minHeight:400}}>
            {preview.fileType === 'application/pdf'
              ? <iframe src={preview.fileUrl} className="w-full h-96 rounded-lg" title="prescription"/>
              : <img src={preview.fileUrl} alt="prescription" className="w-full rounded-lg object-contain max-h-96"/>
            }
          </div>
        )}
      </Modal>
    </div>
  )
}
