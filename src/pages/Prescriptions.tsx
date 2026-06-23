import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Lightbulb, X, Clock, Star, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

// ─── LOCAL MEMORY HELPERS ─────────────────────────────
const LOCAL_MEDS_KEY = 'clinicmx_local_medications'
const LOCAL_INVS_KEY = 'clinicmx_local_investigations'
const LOCAL_FAV_MEDS_KEY = 'clinicmx_favorite_medications'
const LOCAL_FAV_INVS_KEY = 'clinicmx_favorite_investigations'

function getLocalItems(key: string): any[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function saveLocalItem(key: string, item: any) {
  const items = getLocalItems(key)
  const exists = items.some(
    (i: any) => i.name?.toLowerCase() === item.name?.toLowerCase()
  )
  if (!exists && item.name?.trim()) {
    localStorage.setItem(key, JSON.stringify([item, ...items].slice(0, 30)))
  }
}

function addToFavorites(key: string, item: any) {
  const favorites = getLocalItems(key)
  const exists = favorites.some((i: any) => i.name?.toLowerCase() === item.name?.toLowerCase())
  if (!exists && item.name?.trim()) {
    localStorage.setItem(key, JSON.stringify([item, ...favorites].slice(0, 10)))
  }
}

function removeFromFavorites(key: string, itemName: string) {
  const favorites = getLocalItems(key)
  localStorage.setItem(
    key,
    JSON.stringify(favorites.filter((i: any) => i.name?.toLowerCase() !== itemName.toLowerCase()))
  )
}

function isFavorite(key: string, itemName: string): boolean {
  const favorites = getLocalItems(key)
  return favorites.some((i: any) => i.name?.toLowerCase() === itemName.toLowerCase())
}

function clearHistory(key: string) {
  localStorage.setItem(key, JSON.stringify([]))
}
// ─────────────────────────────────────────────────────

export function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [medicationTemplates, setMedicationTemplates] = useState<any[]>([])
  const [investigationTemplates, setInvestigationTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMedTemplates, setShowMedTemplates] = useState(false)
  const [showInvTemplates, setShowInvTemplates] = useState(false)

  const [localMeds, setLocalMeds] = useState<any[]>([])
  const [localInvs, setLocalInvs] = useState<any[]>([])
  const [favMeds, setFavMeds] = useState<any[]>([])
  const [favInvs, setFavInvs] = useState<any[]>([])

  const [medSearchFilter, setMedSearchFilter] = useState('')
  const [invSearchFilter, setInvSearchFilter] = useState('')
  const [expandMedHistory, setExpandMedHistory] = useState(true)
  const [expandInvHistory, setExpandInvHistory] = useState(true)

  const [formData, setFormData] = useState({
    patient_id: '',
    diagnosis: '',
    notes: '',
    prescribed_date: format(new Date(), 'yyyy-MM-dd'),
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    investigations: [{ name: '', description: '' }],
  })

  useEffect(() => {
    loadPrescriptions()
    loadPatients()
    loadTemplates()
    setLocalMeds(getLocalItems(LOCAL_MEDS_KEY))
    setLocalInvs(getLocalItems(LOCAL_INVS_KEY))
    setFavMeds(getLocalItems(LOCAL_FAV_MEDS_KEY))
    setFavInvs(getLocalItems(LOCAL_FAV_INVS_KEY))
  }, [])

  async function loadPrescriptions() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('prescriptions')
        .select(`*, patients (first_name, last_name)`)
        .order('prescribed_date', { ascending: false })
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error loading prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPatients() {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('first_name')
    setPatients(data || [])
  }

  async function loadTemplates() {
    const { data: medTemplates } = await supabase
      .from('medication_templates')
      .select('*')
      .order('usage_count', { ascending: false })

    const { data: invTemplates } = await supabase
      .from('investigation_templates')
      .select('*')
      .order('usage_count', { ascending: false })

    setMedicationTemplates(medTemplates || [])
    setInvestigationTemplates(invTemplates || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await supabase.from('prescriptions').insert([
        {
          patient_id: formData.patient_id,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
          prescribed_date: formData.prescribed_date,
          medications: formData.medications.filter((m) => m.name.trim()),
          investigations: formData.investigations.filter((i) => i.name.trim()),
        },
      ])

      for (const med of formData.medications) {
        if (med.name.trim()) {
          const existing = medicationTemplates.find(
            (t) => t.name.toLowerCase() === med.name.toLowerCase()
          )
          if (existing) {
            await supabase
              .from('medication_templates')
              .update({ usage_count: existing.usage_count + 1 })
              .eq('id', existing.id)
          } else {
            await supabase.from('medication_templates').insert([
              {
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                instructions: med.instructions,
                usage_count: 1,
              },
            ])
          }
          saveLocalItem(LOCAL_MEDS_KEY, med)
        }
      }

      for (const inv of formData.investigations) {
        if (inv.name.trim()) {
          const existing = investigationTemplates.find(
            (t) => t.name.toLowerCase() === inv.name.toLowerCase()
          )
          if (existing) {
            await supabase
              .from('investigation_templates')
              .update({ usage_count: existing.usage_count + 1 })
              .eq('id', existing.id)
          } else {
            await supabase.from('investigation_templates').insert([
              {
                name: inv.name,
                description: inv.description,
                usage_count: 1,
              },
            ])
          }
          saveLocalItem(LOCAL_INVS_KEY, inv)
        }
      }

      setShowForm(false)
      resetForm()
      loadPrescriptions()
      loadTemplates()
      setLocalMeds(getLocalItems(LOCAL_MEDS_KEY))
      setLocalInvs(getLocalItems(LOCAL_INVS_KEY))
      setFavMeds(getLocalItems(LOCAL_FAV_MEDS_KEY))
      setFavInvs(getLocalItems(LOCAL_FAV_INVS_KEY))
    } catch (error) {
      console.error('Error creating prescription:', error)
      alert('Failed to create prescription')
    }
  }

  function resetForm() {
    setFormData({
      patient_id: '',
      diagnosis: '',
      notes: '',
      prescribed_date: format(new Date(), 'yyyy-MM-dd'),
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      investigations: [{ name: '', description: '' }],
    })
  }

  function addMedication() {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    })
  }

  function removeMedication(index: number) {
    const newMeds = formData.medications.filter((_, i) => i !== index)
    setFormData({ ...formData, medications: newMeds })
  }

  function addInvestigation() {
    setFormData({
      ...formData,
      investigations: [...formData.investigations, { name: '', description: '' }],
    })
  }

  function removeInvestigation(index: number) {
    const newInvs = formData.investigations.filter((_, i) => i !== index)
    setFormData({ ...formData, investigations: newInvs })
  }

  function addMedicationFromTemplate(template: any) {
    const newMeds = [...formData.medications]
    const emptyIndex = newMeds.findIndex((m) => !m.name)
    if (emptyIndex >= 0) {
      newMeds[emptyIndex] = {
        name: template.name,
        dosage: template.dosage || '',
        frequency: template.frequency || '',
        duration: template.duration || '',
        instructions: template.instructions || '',
      }
    } else {
      newMeds.push({
        name: template.name,
        dosage: template.dosage || '',
        frequency: template.frequency || '',
        duration: template.duration || '',
        instructions: template.instructions || '',
      })
    }
    setFormData({ ...formData, medications: newMeds })
    setShowMedTemplates(false)
  }

  function addInvestigationFromTemplate(template: any) {
    const newInvs = [...formData.investigations]
    const emptyIndex = newInvs.findIndex((i) => !i.name)
    if (emptyIndex >= 0) {
      newInvs[emptyIndex] = {
        name: template.name,
        description: template.description || '',
      }
    } else {
      newInvs.push({
        name: template.name,
        description: template.description || '',
      })
    }
    setFormData({ ...formData, investigations: newInvs })
    setShowInvTemplates(false)
  }

  function applyLocalMedication(med: any) {
    const newMeds = [...formData.medications]
    const emptyIndex = newMeds.findIndex((m) => !m.name.trim())
    const item = {
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      instructions: med.instructions || '',
    }
    if (emptyIndex >= 0) {
      newMeds[emptyIndex] = item
    } else {
      newMeds.push(item)
    }
    setFormData({ ...formData, medications: newMeds })
  }

  function applyLocalInvestigation(inv: any) {
    const newInvs = [...formData.investigations]
    const emptyIndex = newInvs.findIndex((i) => !i.name.trim())
    const item = {
      name: inv.name || '',
      description: inv.description || '',
    }
    if (emptyIndex >= 0) {
      newInvs[emptyIndex] = item
    } else {
      newInvs.push(item)
    }
    setFormData({ ...formData, investigations: newInvs })
  }

  function toggleFavMedication(med: any) {
    if (isFavorite(LOCAL_FAV_MEDS_KEY, med.name)) {
      removeFromFavorites(LOCAL_FAV_MEDS_KEY, med.name)
    } else {
      addToFavorites(LOCAL_FAV_MEDS_KEY, med)
    }
    setFavMeds(getLocalItems(LOCAL_FAV_MEDS_KEY))
  }

  function toggleFavInvestigation(inv: any) {
    if (isFavorite(LOCAL_FAV_INVS_KEY, inv.name)) {
      removeFromFavorites(LOCAL_FAV_INVS_KEY, inv.name)
    } else {
      addToFavorites(LOCAL_FAV_INVS_KEY, inv)
    }
    setFavInvs(getLocalItems(LOCAL_FAV_INVS_KEY))
  }

  const filteredMeds = localMeds.filter((med) =>
    med.name.toLowerCase().includes(medSearchFilter.toLowerCase())
  )

  const filteredInvs = localInvs.filter((inv) =>
    inv.name.toLowerCase().includes(invSearchFilter.toLowerCase())
  )

  const filteredPrescriptions = prescriptions.filter((p) => {
    const patientName = `${p.patients?.first_name} ${p.patients?.last_name}`.toLowerCase()
    return (
      patientName.includes(searchTerm.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-text-secondary">Manage patient prescriptions and investigations</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Prescription
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search prescriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Medications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Investigations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {prescription.patients?.first_name} {prescription.patients?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {format(new Date(prescription.prescribed_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm">{prescription.diagnosis || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      {Array.isArray(prescription.medications) && prescription.medications.length > 0
                        ? `${prescription.medications.length} medication(s)`
                        : 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {Array.isArray(prescription.investigations) && prescription.investigations.length > 0
                        ? `${prescription.investigations.length} test(s)`
                        : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">New Prescription</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Patient *</label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.prescribed_date}
                    onChange={(e) => setFormData({ ...formData, prescribed_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Enter diagnosis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* MEDICATIONS SECTION WITH IMPROVED UI */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-bold">Medications</label>
                    <p className="text-xs text-text-secondary">Add medications for this prescription</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMedTemplates(!showMedTemplates)}
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Templates
                    </Button>
                    <Button type="button" size="sm" onClick={addMedication}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* TEMPLATE SUGGESTIONS */}
                {showMedTemplates && medicationTemplates.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Popular Templates
                      </h4>
                      <button type="button" onClick={() => setShowMedTemplates(false)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {medicationTemplates.slice(0, 10).map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => addMedicationFromTemplate(template)}
                          className="text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-primary hover:bg-primary/5 transition-all hover:shadow-sm"
                        >
                          <div className="font-medium text-sm text-gray-900">{template.name}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            {template.dosage} • {template.frequency} • {template.duration}
                          </div>
                          <div className="text-xs text-blue-600 mt-2 font-medium">
                            {template.usage_count} times used
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MEDICATION INPUT FIELDS */}
                <div className="space-y-3 mb-4">
                  {formData.medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={med.name}
                        onChange={(e) => {
                          const newMeds = [...formData.medications]
                          newMeds[index].name = e.target.value
                          setFormData({ ...formData, medications: newMeds })
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={med.dosage}
                        onChange={(e) => {
                          const newMeds = [...formData.medications]
                          newMeds[index].dosage = e.target.value
                          setFormData({ ...formData, medications: newMeds })
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={med.frequency}
                        onChange={(e) => {
                          const newMeds = [...formData.medications]
                          newMeds[index].frequency = e.target.value
                          setFormData({ ...formData, medications: newMeds })
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Duration"
                        value={med.duration}
                        onChange={(e) => {
                          const newMeds = [...formData.medications]
                          newMeds[index].duration = e.target.value
                          setFormData({ ...formData, medications: newMeds })
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Instructions"
                          value={med.instructions}
                          onChange={(e) => {
                            const newMeds = [...formData.medications]
                            newMeds[index].instructions = e.target.value
                            setFormData({ ...formData, medications: newMeds })
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {formData.medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAVORITES SECTION */}
                {favMeds.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-semibold text-sm text-gray-900">Favorite Medications</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {favMeds.map((med, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyLocalMedication(med)}
                          className="px-3 py-1.5 bg-white text-yellow-700 text-sm rounded-full border border-yellow-300 hover:bg-yellow-50 transition-colors font-medium"
                          title={`${med.dosage} • ${med.frequency} • ${med.duration}`}
                        >
                          {med.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECENT HISTORY SECTION */}
                {localMeds.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <button
                      type="button"
                      onClick={() => setExpandMedHistory(!expandMedHistory)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-sm text-gray-900">
                          Recent Medications ({localMeds.length})
                        </h4>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expandMedHistory ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {expandMedHistory && (
                      <>
                        {/* SEARCH FILTER */}
                        <div className="mt-3 mb-2">
                          <input
                            type="text"
                            placeholder="Search medications..."
                            value={medSearchFilter}
                            onChange={(e) => setMedSearchFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {/* HISTORY GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {filteredMeds.map((med, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-sm transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => applyLocalMedication(med)}
                                  className="text-left flex-1 min-w-0"
                                >
                                  <div className="font-medium text-sm text-gray-900 truncate">
                                    {med.name}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">
                                    {[med.dosage, med.frequency, med.duration]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleFavMedication(med)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={isFavorite(LOCAL_FAV_MEDS_KEY, med.name) ? 'Remove favorite' : 'Add to favorites'}
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      isFavorite(LOCAL_FAV_MEDS_KEY, med.name)
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {filteredMeds.length === 0 && (
                          <div className="text-center py-4 text-sm text-gray-600">
                            No medications matching your search
                          </div>
                        )}

                        {/* CLEAR HISTORY BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Clear all medication history?')) {
                              clearHistory(LOCAL_MEDS_KEY)
                              setLocalMeds([])
                              setMedSearchFilter('')
                            }
                          }}
                          className="mt-3 w-full text-xs text-red-600 hover:text-red-700 font-medium py-1"
                        >
                          Clear History
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* INVESTIGATIONS SECTION WITH IMPROVED UI */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-bold">Investigations</label>
                    <p className="text-xs text-text-secondary">Add tests and investigations</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInvTemplates(!showInvTemplates)}
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Templates
                    </Button>
                    <Button type="button" size="sm" onClick={addInvestigation}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* TEMPLATE SUGGESTIONS */}
                {showInvTemplates && investigationTemplates.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        Popular Templates
                      </h4>
                      <button type="button" onClick={() => setShowInvTemplates(false)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {investigationTemplates.slice(0, 12).map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => addInvestigationFromTemplate(template)}
                          className="text-left p-3 bg-white rounded-lg border border-green-200 hover:border-primary hover:bg-primary/5 transition-all hover:shadow-sm"
                        >
                          <div className="font-medium text-sm text-gray-900">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-text-secondary mt-1 truncate">
                              {template.description}
                            </div>
                          )}
                          <div className="text-xs text-green-600 mt-2 font-medium">
                            {template.usage_count} times used
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* INVESTIGATION INPUT FIELDS */}
                <div className="space-y-3 mb-4">
                  {formData.investigations.map((inv, index) => (
                    <div key={index} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Investigation name (e.g., CBC, X-Ray)"
                        value={inv.name}
                        onChange={(e) => {
                          const newInvs = [...formData.investigations]
                          newInvs[index].name = e.target.value
                          setFormData({ ...formData, investigations: newInvs })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={inv.description}
                        onChange={(e) => {
                          const newInvs = [...formData.investigations]
                          newInvs[index].description = e.target.value
                          setFormData({ ...formData, investigations: newInvs })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {formData.investigations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvestigation(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* FAVORITES SECTION */}
                {favInvs.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-semibold text-sm text-gray-900">Favorite Investigations</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {favInvs.map((inv, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyLocalInvestigation(inv)}
                          className="px-3 py-1.5 bg-white text-yellow-700 text-sm rounded-full border border-yellow-300 hover:bg-yellow-50 transition-colors font-medium"
                          title={inv.description || ''}
                        >
                          {inv.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECENT HISTORY SECTION */}
                {localInvs.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <button
                      type="button"
                      onClick={() => setExpandInvHistory(!expandInvHistory)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <h4 className="font-semibold text-sm text-gray-900">
                          Recent Investigations ({localInvs.length})
                        </h4>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expandInvHistory ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {expandInvHistory && (
                      <>
                        {/* SEARCH FILTER */}
                        <div className="mt-3 mb-2">
                          <input
                            type="text"
                            placeholder="Search investigations..."
                            value={invSearchFilter}
                            onChange={(e) => setInvSearchFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {/* HISTORY GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {filteredInvs.map((inv, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-sm transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => applyLocalInvestigation(inv)}
                                  className="text-left flex-1 min-w-0"
                                >
                                  <div className="font-medium text-sm text-gray-900 truncate">
                                    {inv.name}
                                  </div>
                                  {inv.description && (
                                    <div className="text-xs text-gray-600 truncate">
                                      {inv.description}
                                    </div>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleFavInvestigation(inv)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={isFavorite(LOCAL_FAV_INVS_KEY, inv.name) ? 'Remove favorite' : 'Add to favorites'}
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      isFavorite(LOCAL_FAV_INVS_KEY, inv.name)
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {filteredInvs.length === 0 && (
                          <div className="text-center py-4 text-sm text-gray-600">
                            No investigations matching your search
                          </div>
                        )}

                        {/* CLEAR HISTORY BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Clear all investigation history?')) {
                              clearHistory(LOCAL_INVS_KEY)
                              setLocalInvs([])
                              setInvSearchFilter('')
                            }
                          }}
                          className="mt-3 w-full text-xs text-red-600 hover:text-red-700 font-medium py-1"
                        >
                          Clear History
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" className="flex-1">
                  Create Prescription
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
