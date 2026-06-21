import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Patients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-text-secondary mt-1">Manage your patient records</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search patients..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="divide-y divide-gray-200">
          <PatientRow name="John Doe" phone="+1 234 567 8900" email="john@example.com" />
          <PatientRow name="Jane Smith" phone="+1 234 567 8901" email="jane@example.com" />
          <PatientRow name="Mike Johnson" phone="+1 234 567 8902" email="mike@example.com" />
        </div>
      </div>
    </div>
  )
}

function PatientRow({ name, phone, email }: any) {
  return (
    <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
          {name[0]}
        </div>
        <div className="flex-1">
          <p className="font-medium">{name}</p>
          <div className="flex gap-4 mt-1">
            <span className="text-sm text-text-secondary">{phone}</span>
            <span className="text-sm text-text-secondary">{email}</span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </div>
    </div>
  )
}
