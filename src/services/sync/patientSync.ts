/**
 * Patient profile sync helpers for Google Sheets.
 *
 * Call syncPatientToSheets() after creating or updating a patient record
 * in Supabase.  Call removePatientFromSheets() after deleting one.
 *
 * Both functions are no-ops when Google is not configured, so the existing
 * Supabase-only workflow remains completely intact.
 */

import { isGoogleConfigured } from '../google/googleAuth'
import {
  upsertPatientRow,
  deletePatientRow,
  type PatientRow,
} from '../google/googleSheets'

export interface PatientSyncPayload {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null   // YYYY-MM-DD
  gender: string | null
  medical_history: string | null
}

function buildPatientRow(patient: PatientSyncPayload): PatientRow {
  return {
    recordId: patient.id,
    firstName: patient.first_name,
    lastName: patient.last_name,
    email: patient.email ?? '',
    phone: patient.phone ?? '',
    dateOfBirth: patient.date_of_birth ?? '',
    gender: patient.gender ?? '',
    medicalHistory: patient.medical_history ?? '',
  }
}

/**
 * Syncs a single patient profile to the Google Sheets "Patients" tab.
 * Creates a new row or updates the existing one matched by record ID.
 *
 * Returns true on success, false when Google is not configured or on error.
 */
export async function syncPatientToSheets(patient: PatientSyncPayload): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    return await upsertPatientRow(buildPatientRow(patient))
  } catch (error) {
    console.error('[PatientSync] syncPatientToSheets error:', error)
    return false
  }
}

/**
 * Removes a patient row from the Google Sheets "Patients" tab.
 *
 * Returns true on success, false when Google is not configured or on error.
 */
export async function removePatientFromSheets(patientId: string): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    return await deletePatientRow(patientId)
  } catch (error) {
    console.error('[PatientSync] removePatientFromSheets error:', error)
    return false
  }
}
