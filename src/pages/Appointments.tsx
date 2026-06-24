import { useState, useEffect } from 'react'
import { Plus, CheckCircle, XCircle, ClipboardCheck, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { AppointmentModal } from '@/components/AppointmentModal'

interface Appointment {
  id: string
  patient_id: string
  date_time: string
  duration: number
  type: string
  status: string
  notes: string | null
  created_at: string
  patients: {
    first_name: string
    last_name: string
  }
}

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    loadAppointments()
    loadWeekAppointments()
  }, [selectedDate])

  async function loadWeekAppointments() {
    try {
      const weekEnd = addDays(weekStart, 6)
      weekEnd.setHours(23, 59, 59, 999)
      const { data } = await supabase
        .from('appointments')
        .select('date_time, status')
        .gte('date_time', weekStart.toISOString())
        .lte('date_time', weekEnd.toISOString())
      setWeekAppointments((data as any) || [])
    } catch {
      // ignore
    }
  }

  async function loadAppointments() {
    try {
      setLoading(true)
      
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name)
        `)
        .gte('date_time', startOfDay.toISOString())
        .lte('date_time', endOfDay.toISOString())
        .order('date_time')

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
      )
    } catch (error) {
      console.error('Error updating appointment status:', error)
      alert('Failed to update appointment')
    }
  }

  async function cancelAppointment(id: string) {
    if (!confirm('Cancel this appointment?')) return
    updateStatus(id, 'Cancelled')
  }

  function getDotsForDay(day: Date) {
    return weekAppointments.filter(a =>
      isSameDay(new Date(a.date_time), day) && a.status !== 'Cancelled'
    ).length
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-text-secondary mt-1">Schedule and manage appointments</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Week View</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>Next</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            const dotCount = getDotsForDay(day)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
<<<<<<< HEAD
                className={`p-3 rounded-lg text-center transition-all duration-150 hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-white shadow-md'
                    : isToday
                    ? 'bg-blue-50 text-primary border border-primary'
                    : 'hover:bg-gray-100'
=======
                className={`p-3 rounded-lg text-center transition-colors ${
                  isSelected ? 'bg-primary text-white' : isToday ? 'bg-blue-50 text-primary border border-primary' : 'hover:bg-gray-100'
>>>>>>> origin/main
                }`}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold mt-1">{format(day, 'd')}</div>
                <div className="mt-1 flex justify-center gap-0.5 h-2">
                  {dotCount > 0 && [...Array(Math.min(dotCount, 3))].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-primary'}`}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">Appointments for {format(selectedDate, 'MMMM d, yyyy')}</h3>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <span className="spinner" />
          </div>
        ) : appointments.length === 0 ? (
<<<<<<< HEAD
          <div className="p-8 text-center text-text-secondary">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No appointments for this day
          </div>
=======
          <div className="p-8 text-center text-text-secondary">No appointments for this day</div>
>>>>>>> origin/main
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onCancel={() => cancelAppointment(appointment.id)}
                onStatusChange={(status) => updateStatus(appointment.id, status)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AppointmentModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
<<<<<<< HEAD
          onSave={() => { loadAppointments(); loadWeekAppointments(); setShowModal(false) }}
=======
          onSave={() => {
            loadAppointments()
            setShowModal(false)
          }}
>>>>>>> origin/main
        />
      )}
    </div>
  )
}

function AppointmentRow({ appointment, onCancel, onStatusChange }: {
  appointment: Appointment
  onCancel: () => void
  onStatusChange: (status: string) => void
}) {
  const statusColors: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-green-100 text-green-700',
    Completed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
  }

  const isClosed = appointment.status === 'Cancelled' || appointment.status === 'Completed'

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">
              {appointment.patients.first_name} {appointment.patients.last_name}
            </p>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100'}`}>
              {appointment.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {formatLocalAppointmentDateTime(appointment.date_time)} • {appointment.duration} min • {appointment.type}
          </p>
          {appointment.notes && <p className="text-sm text-text-secondary mt-1">{appointment.notes}</p>}
        </div>

        {!isClosed && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {appointment.status === 'Scheduled' && (
              <button
                onClick={() => onStatusChange('Confirmed')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                title="Confirm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Confirm
              </button>
            )}
            {appointment.status === 'Confirmed' && (
              <button
                onClick={() => onStatusChange('Completed')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Mark Completed"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Done
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Cancel"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

<<<<<<< HEAD

=======
function parseFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first_name: parts[0], last_name: '-' }
  const last = parts.pop()!
  return { first_name: parts.join(' '), last_name: last }
}

function deriveDOBFromAge(age: number): string {
  const year = new Date().getFullYear() - age
  return `${year}-01-01`
}

function toLocalDateTimeValue(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime()
}

function formatLocalAppointmentDateTime(dateTime: string) {
  const [datePart, timePart] = dateTime.split('T')
  if (!datePart || !timePart) return dateTime

  const [hoursStr, minutesStr] = timePart.split(':')
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12

  return `${normalizedHours}:${minutes.toString().padStart(2, '0')} ${suffix}`
}

function AppointmentModal({ selectedDate, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_sex: '',
    patient_mobile: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: '09:00',
    duration: '30',
    type: 'Checkup',
    status: 'Scheduled',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')

    try {
      const appointmentStart = toLocalDateTimeValue(formData.date, formData.time)
      const appointmentEnd = appointmentStart + parseInt(formData.duration) * 60000

      const { data: existingAppointments, error: conflictError } = await supabase
        .from('appointments')
        .select('id, date_time, duration, status')
        .neq('status', 'Cancelled')
        .gte('date_time', `${formData.date}T00:00:00`)
        .lt('date_time', `${formData.date}T23:59:59`)

      if (conflictError) throw conflictError

      const exactSameTimeTaken = (existingAppointments || []).some((appointment) => appointment.date_time.slice(11, 16) === formData.time)
      if (exactSameTimeTaken) {
        setErrorMessage('This appointment time is already booked. Please choose another time.')
        return
      }

      const hasConflict = (existingAppointments || []).some((appointment) => {
        const existingStart = toLocalDateTimeValue(appointment.date_time.slice(0, 10), appointment.date_time.slice(11, 16))
        const existingEnd = existingStart + appointment.duration * 60000
        return appointmentStart < existingEnd && appointmentEnd > existingStart
      })

      if (hasConflict) {
        setErrorMessage('This appointment overlaps with an existing booking. Please choose another time.')
        return
      }

      const { first_name, last_name } = parseFullName(formData.patient_name)
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            first_name,
            last_name,
            phone: formData.patient_mobile,
            gender: formData.patient_sex,
            date_of_birth: deriveDOBFromAge(parseInt(formData.patient_age)),
            email: `noemail+${Date.now()}@placeholder.local`,
          },
        ])
        .select('id')
        .single()

      if (patientError) throw patientError

      const { error: apptError } = await supabase.from('appointments').insert([
        {
          patient_id: patientData.id,
          date_time: `${formData.date}T${formData.time}:00`,
          duration: parseInt(formData.duration),
          type: formData.type,
          status: formData.status,
          notes: formData.notes || null,
        },
      ])

      if (apptError) throw apptError
      onSave()
    } catch (error) {
      console.error('Error creating appointment:', error)
      setErrorMessage('Failed to create appointment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">New Appointment</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Patient Name *</label>
            <input type="text" required placeholder="Full name" value={formData.patient_name} onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age *</label>
              <input type="number" required min="0" max="150" placeholder="Years" value={formData.patient_age} onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sex *</label>
              <select required value={formData.patient_sex} onChange={(e) => setFormData({ ...formData, patient_sex: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number *</label>
            <input type="tel" required placeholder="Mobile number" value={formData.patient_mobile} onChange={(e) => setFormData({ ...formData, patient_mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (min)</label>
              <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Checkup</option>
                <option>Cleaning</option>
                <option>Filling</option>
                <option>Root Canal</option>
                <option>Extraction</option>
                <option>Consultation</option>
                <option>Follow-up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Creating...' : 'Create Appointment'}
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
>>>>>>> origin/main
