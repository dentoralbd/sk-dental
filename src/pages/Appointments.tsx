import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { format, addDays, startOfWeek } from 'date-fns'
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
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [selectedDate])

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

  async function cancelAppointment(id: string) {
    if (!confirm('Cancel this appointment?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Cancelled' })
        .eq('id', id)

      if (error) throw error
      loadAppointments()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment')
    }
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-6">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : isToday
                    ? 'bg-blue-50 text-primary border border-primary'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold mt-1">{format(day, 'd')}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">
            Appointments for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-secondary">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            No appointments for this day
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onCancel={() => cancelAppointment(appointment.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AppointmentModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={() => { loadAppointments(); setShowModal(false) }}
        />
      )}
    </div>
  )
}

function AppointmentRow({ appointment, onCancel }: { appointment: Appointment; onCancel: () => void }) {
  const statusColors: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-green-100 text-green-700',
    Completed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {appointment.patients.first_name} {appointment.patients.last_name}
            </p>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100'}`}>
              {appointment.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {format(new Date(appointment.date_time), 'h:mm a')} • {appointment.duration} min • {appointment.type}
          </p>
          {appointment.notes && (
            <p className="text-sm text-text-secondary mt-1">{appointment.notes}</p>
          )}
        </div>
        {appointment.status !== 'Cancelled' && appointment.status !== 'Completed' && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

