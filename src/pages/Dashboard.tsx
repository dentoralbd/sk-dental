export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's your clinic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Appointments" value="12" icon="📅" color="blue" />
        <StatCard title="Total Patients" value="248" icon="👥" color="green" />
        <StatCard title="Pending Bills" value="8" icon="💰" color="orange" />
        <StatCard title="Revenue (Month)" value="$12,450" icon="📊" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
          <div className="space-y-3">
            <AppointmentItem time="09:00 AM" patient="John Doe" type="Checkup" />
            <AppointmentItem time="10:30 AM" patient="Jane Smith" type="Cleaning" />
            <AppointmentItem time="02:00 PM" patient="Mike Johnson" type="Filling" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Patients</h3>
          <div className="space-y-3">
            <PatientItem name="Sarah Williams" lastVisit="2 days ago" />
            <PatientItem name="Robert Brown" lastVisit="5 days ago" />
            <PatientItem name="Emily Davis" lastVisit="1 week ago" />
          </div>
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
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center text-2xl`}>
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
        <p className="text-sm text-text-secondary">Last visit: {lastVisit}</p>
      </div>
    </div>
  )
}
