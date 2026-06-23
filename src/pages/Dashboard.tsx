import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface Stats {
  totalPatients: number
  todayAppointments: number
  pendingInvoices: number
  monthRevenue: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingInvoices: 0,
    monthRevenue: 0,
  })
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

      // Get total patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })

      // Get today's appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name)
        `)
        .gte('date_time', `${today}T00:00:00`)
        .lt('date_time', `${today}T23:59:59`)
        .order('date_time')
        .limit(5)

      // Get pending invoices count
      const { count: pendingCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending')

      // Get month revenue
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('created_at', monthStart)
        .eq('status', 'Paid')

      const revenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

      // Get recent patients
      const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalPatients: patientsCount || 0,
        todayAppointments: appointments?.length || 0,
        pendingInvoices: pendingCount || 0,
        monthRevenue: revenue,
      })
      setTodayAppointments(appointments || [])
      setRecentPatients(patients || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's your clinic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments.toString()}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toString()}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Pending Bills"
          value={stats.pendingInvoices.toString()}
          icon={<DollarSign className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Revenue (Month)"
          value={`$${stats.monthRevenue.toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
          {todayAppointments.length === 0 ? (
            <p className="text-text-secondary text-center py-4">No appointments today</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <AppointmentItem
                  key={apt.id}
                  time={format(new Date(apt.date_time), 'h:mm a')}
                  patient={`${apt.patients.first_name} ${apt.patients.last_name}`}
                  type={apt.type}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Patients</h3>
          {recentPatients.length === 0 ? (
            <p className="text-text-secondary text-center py-4">No patients yet</p>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <PatientItem
                  key={patient.id}
                  name={`${patient.first_name} ${patient.last_name}`}
                  lastVisit={format(new Date(patient.created_at), 'MMM d, yyyy')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function AppointmentItem({ time, patient, type }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{patient}</p>
        <p className="text-sm text-text-secondary">{type}</p>
      </div>
      <span className="text-sm font-medium text-primary">{time}</span>
    </div>
  )
}

function PatientItem({ name, lastVisit }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
        {name[0]}
      </div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-text-secondary">Added: {lastVisit}</p>
      </div>
    </div>
  )
}
