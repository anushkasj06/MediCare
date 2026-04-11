import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Activity, FileText, Download } from 'lucide-react'
import { Tabs, EmptyState, StatusChip } from '../../components/common/index.jsx'
import { usePatientMedicalHistory } from '../../hooks/index.js'
import { formatDate } from '../../utils/index.js'

const RECORD_TYPE_COLORS = {
  consultation: 'bg-primary-soft text-primary',
  diagnosis:    'bg-accent-soft text-accent-dark',
  lab:          'bg-warning-soft text-warning',
  followup:     'bg-success-soft text-success',
  discharge:    'bg-error-soft text-error',
}

export default function PatientMedicalHistory() {
  const user = useSelector(s => s.auth.user)
  const [filter, setFilter] = useState('all')
  const { data, loading } = usePatientMedicalHistory({ recordType: filter === 'all' ? undefined : filter })
  const records = Array.isArray(data) ? data : (data?.records || data?.history || [])

  const typeOptions = ['all','consultation','diagnosis','lab','followup','discharge']

  return (
    <div className="space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Medical History</h2>

      <Tabs
        tabs={typeOptions.map(t=>({id:t, label:t.charAt(0).toUpperCase()+t.slice(1)}))}
        active={filter} onChange={setFilter}
      />

      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}

      {!loading && records.length === 0 && (
        <EmptyState icon={<Activity size={28}/>} message="No medical records found"/>
      )}

      <div className="relative">
        {/* Timeline line */}
        {records.length > 0 && <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border"/>}

        <div className="space-y-4">
          {records.map(rec => (
            <div key={rec._id} className="flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-border flex items-center justify-center">
                  <Activity size={16} className="text-primary"/>
                </div>
              </div>

              <div className="card p-5 flex-1 space-y-3 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text">{rec.diagnosis}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RECORD_TYPE_COLORS[rec.recordType] || 'bg-border text-text-muted'}`}>
                        {rec.recordType}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Dr. {rec.doctorId?.fullName || '—'} · {formatDate(rec.createdAt)}
                    </p>
                  </div>
                  {rec.followUpDate && (
                    <span className="text-xs text-warning bg-warning-soft px-2 py-1 rounded-lg whitespace-nowrap">
                      Follow-up: {formatDate(rec.followUpDate)}
                    </span>
                  )}
                </div>

                {rec.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.symptoms.map((s,i) => (
                      <span key={i} className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full text-text-muted">{s}</span>
                    ))}
                  </div>
                )}

                {rec.treatment && (
                  <div className="text-xs text-text-muted">
                    <span className="font-medium text-text">Treatment: </span>{rec.treatment}
                  </div>
                )}

                {rec.vitals && Object.values(rec.vitals).some(Boolean) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rec.vitals.bloodPressure && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">BP</p><p className="font-semibold text-xs">{rec.vitals.bloodPressure}</p></div>}
                    {rec.vitals.heartRate     && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">Heart Rate</p><p className="font-semibold text-xs">{rec.vitals.heartRate} bpm</p></div>}
                    {rec.vitals.temperature   && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">Temp</p><p className="font-semibold text-xs">{rec.vitals.temperature}°F</p></div>}
                    {rec.vitals.weight        && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">Weight</p><p className="font-semibold text-xs">{rec.vitals.weight} kg</p></div>}
                  </div>
                )}

                {rec.doctorNotes && (
                  <div className="border-t border-border pt-2 text-xs text-text-muted">
                    <span className="font-medium text-text">Doctor's notes: </span>{rec.doctorNotes}
                  </div>
                )}

                {rec.labReports?.length > 0 && (
                  <div className="flex gap-2 flex-wrap border-t border-border pt-2">
                    {rec.labReports.map((lr,i) => (
                      <a key={i} href={lr.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <FileText size={12}/> {lr.fileName || `Lab Report ${i+1}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
