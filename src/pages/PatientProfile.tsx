import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Activity, FileText, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export function PatientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [dentalRecords, setDentalRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'dental-chart'>('overview')
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      loadPatientData()
    }
  }, [id])

  async function loadPatientData() {
    try {
      setLoading(true)
      
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      const { data: visitsData } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('patient_id', id)
        .order('visit_date', { ascending: false })

      const { data: dentalData } = await supabase
        .from('dental_records')
        .select('*')
        .eq('patient_id', id)

      setPatient(patientData)
      setVisits(visitsData || [])
      setDentalRecords(dentalData || [])
    } catch (error) {
      console.error('Error loading patient:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveToothCondition(toothNumber: number, condition: string, notes: string) {
    if (!id) return

    try {
      const existing = dentalRecords.find(r => r.tooth_number === toothNumber)
      
      if (existing) {
        await supabase
          .from('dental_records')
          .update({ condition, notes, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('dental_records')
          .insert([{
            patient_id: id,
            tooth_number: toothNumber,
            condition,
            notes,
          }])
      }
      
      loadPatientData()
      setSelectedTooth(null)
    } catch (error) {
      console.error('Error saving tooth:', error)
      alert('Failed to save')
    }
  }

  const getToothCondition = (toothNumber: number) => {
    const record = dentalRecords.find(r => r.tooth_number === toothNumber)
    return record?.condition || 'Healthy'
  }

  const getToothColor = (condition: string) => {
    const colors: Record<string, string> = {
      Healthy: 'fill-white stroke-gray-400',
      Cavity: 'fill-red-200 stroke-red-500',
      Filled: 'fill-blue-200 stroke-blue-500',
      'Root Canal': 'fill-purple-200 stroke-purple-500',
      Crown: 'fill-yellow-200 stroke-yellow-600',
      Missing: 'fill-gray-300 stroke-gray-500',
      Implant: 'fill-green-200 stroke-green-500',
    }
    return colors[condition] || colors.Healthy
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!patient) {
    return <div className="p-6">Patient not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-text-secondary">{patient.email} • {patient.phone}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'visits'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Visits ({visits.length})
        </button>
        <button
          onClick={() => setActiveTab('dental-chart')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'dental-chart'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Dental Chart
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Patient Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-text-secondary">DOB:</span> {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</div>
              <div><span className="text-text-secondary">Gender:</span> {patient.gender}</div>
              <div><span className="text-text-secondary">Address:</span> {patient.address || 'N/A'}</div>
              {patient.medical_history && (
                <div><span className="text-text-secondary">Medical History:</span> {patient.medical_history}</div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Recent Visits</h3>
            {visits.length === 0 ? (
              <p className="text-text-secondary text-sm">No visits yet</p>
            ) : (
              <div className="space-y-2">
                {visits.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="font-medium">{format(new Date(visit.visit_date), 'MMM d, yyyy')}</div>
                    <div className="text-text-secondary">{visit.chief_complaint || 'No complaint'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Visit History</h3>
            <Button size="sm">Add Visit</Button>
          </div>
          {visits.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">No visits recorded</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visits.map((visit) => (
                <div key={visit.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-text-secondary" />
                        <span className="font-medium">{format(new Date(visit.visit_date), 'MMMM d, yyyy')}</span>
                      </div>
                      {visit.chief_complaint && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-text-secondary">Chief Complaint: </span>
                          <span className="text-sm">{visit.chief_complaint}</span>
                        </div>
                      )}
                      {visit.diagnosis && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-text-secondary">Diagnosis: </span>
                          <span className="text-sm">{visit.diagnosis}</span>
                        </div>
                      )}
                      {visit.treatment_plan && (
                        <div>
                          <span className="text-sm font-medium text-text-secondary">Treatment Plan: </span>
                          <span className="text-sm">{visit.treatment_plan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'dental-chart' && (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-6 text-center">Dental Chart</h3>
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-4 text-center">Upper Teeth</h4>
              <div className="flex justify-center gap-2 flex-wrap">
                {[...Array(16)].map((_, i) => {
                  const toothNum = i + 1
                  const condition = getToothCondition(toothNum)
                  return (
                    <Tooth
                      key={toothNum}
                      number={toothNum}
                      condition={condition}
                      color={getToothColor(condition)}
                      onClick={() => setSelectedTooth(toothNum)}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-4 text-center">Lower Teeth</h4>
              <div className="flex justify-center gap-2 flex-wrap">
                {[...Array(16)].map((_, i) => {
                  const toothNum = i + 17
                  const condition = getToothCondition(toothNum)
                  return (
                    <Tooth
                      key={toothNum}
                      number={toothNum}
                      condition={condition}
                      color={getToothColor(condition)}
                      onClick={() => setSelectedTooth(toothNum)}
                    />
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-200">
              <Legend color="fill-white stroke-gray-400" label="Healthy" />
              <Legend color="fill-red-200 stroke-red-500" label="Cavity" />
              <Legend color="fill-blue-200 stroke-blue-500" label="Filled" />
              <Legend color="fill-purple-200 stroke-purple-500" label="Root Canal" />
              <Legend color="fill-yellow-200 stroke-yellow-600" label="Crown" />
              <Legend color="fill-gray-300 stroke-gray-500" label="Missing" />
              <Legend color="fill-green-200 stroke-green-500" label="Implant" />
            </div>
          </div>
        </div>
      )}

      {selectedTooth && (
        <ToothModal
          toothNumber={selectedTooth}
          currentCondition={getToothCondition(selectedTooth)}
          currentNotes={dentalRecords.find(r => r.tooth_number === selectedTooth)?.notes || ''}
          onClose={() => setSelectedTooth(null)}
          onSave={saveToothCondition}
        />
      )}
    </div>
  )
}

function Tooth({ number, condition, color, onClick }: any) {
  return (
    <div className="flex flex-col items-center cursor-pointer group" onClick={onClick}>
      <svg width="32" height="48" viewBox="0 0 32 48" className={`${color} group-hover:opacity-75 transition-opacity`}>
        <path
          d="M16 2 C10 2, 6 6, 6 12 C6 18, 8 24, 10 32 C11 36, 12 42, 16 46 C20 42, 21 36, 22 32 C24 24, 26 18, 26 12 C26 6, 22 2, 16 2 Z"
          strokeWidth="2"
        />
      </svg>
      <span className="text-xs font-medium mt-1">{number}</span>
    </div>
  )
}

function Legend({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <svg width="20" height="20" viewBox="0 0 20 20" className={color}>
        <circle cx="10" cy="10" r="8" strokeWidth="2" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  )
}

function ToothModal({ toothNumber, currentCondition, currentNotes, onClose, onSave }: any) {
  const [condition, setCondition] = useState(currentCondition)
  const [notes, setNotes] = useState(currentNotes)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(toothNumber, condition, notes)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Tooth #{toothNumber}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Healthy</option>
              <option>Cavity</option>
              <option>Filled</option>
              <option>Root Canal</option>
              <option>Crown</option>
              <option>Missing</option>
              <option>Implant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this tooth..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
