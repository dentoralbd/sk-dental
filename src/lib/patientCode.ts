import { supabase } from './supabase'

function extractPatientCodeNumber(patientCode?: string | null) {
  if (!patientCode) return null
  const match = /^PT-(\d+)$/.exec(patientCode.trim())
  return match ? Number.parseInt(match[1], 10) : null
}

function formatPatientCode(value: number) {
  return `PT-${String(value).padStart(5, '0')}`
}

async function getHighestPatientCodeNumber() {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_code')
    .not('patient_code', 'is', null)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) throw error

  let highest = 0
  for (const row of data || []) {
    const parsed = extractPatientCodeNumber(row.patient_code)
    if (parsed && parsed > highest) highest = parsed
  }

  return highest
}

export async function ensurePatientCode(patientId: string, existingPatientCode?: string | null) {
  if (existingPatientCode) return existingPatientCode

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const highest = await getHighestPatientCodeNumber()
    const candidateCode = formatPatientCode(highest + 1 + attempt)

    const { error } = await supabase
      .from('patients')
      .update({ patient_code: candidateCode })
      .eq('id', patientId)
      .is('patient_code', null)

    if (!error) {
      const { data: refreshed, error: refreshError } = await supabase
        .from('patients')
        .select('patient_code')
        .eq('id', patientId)
        .single()

      if (refreshError) throw refreshError
      if (refreshed?.patient_code) return refreshed.patient_code
    }

    if ((error as any)?.code !== '23505') throw error
  }

  throw new Error('Unable to assign patient code')
}
