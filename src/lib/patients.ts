import { supabase } from '@/lib/supabase'

interface CreatePatientPayload {
  first_name: string
  last_name: string
  phone: string
  email?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  medical_history?: string | null
  notes?: string | null
}

export async function createPatient(payload: CreatePatientPayload) {
  const patientsTable: any = supabase.from('patients')

  // Only request 'id' in the RETURNING clause so the INSERT succeeds even
  // when the patient_code column has not yet been added by migrations.
  const { data, error } = await patientsTable
    .insert([payload])
    .select('id')
    .single()
  const createdPatient = data as { id: string } | null

  if (error) throw error
  if (!createdPatient?.id) throw new Error('Failed to create patient')

  // Fetch all available columns (patient_code included when migration has run)
  // in a separate read. Ignore any error here so a missing patient_code column
  // does not prevent patient creation from succeeding.
  const { data: patientData } = await patientsTable
    .select('*')
    .eq('id', createdPatient.id)
    .single()
  const fetchedPatient = patientData as { id: string; patient_code?: string | null } | null

  return fetchedPatient || createdPatient
}
