import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { Patients } from './pages/Patients'
import { Appointments } from './pages/Appointments'
import { DentalChart } from './pages/DentalChart'
import { Treatments } from './pages/Treatments'
import { Prescriptions } from './pages/Prescriptions'
import { Billing } from './pages/Billing'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="dental-chart/:patientId" element={<DentalChart />} />
        <Route path="treatments" element={<Treatments />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="billing" element={<Billing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
