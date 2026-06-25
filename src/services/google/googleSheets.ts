/**
 * Google Sheets sync operations for Clinicmx.
 *
 * Provides helpers to append, update, and delete rows in two sheets:
 *   - "Appointments"  (sheet for appointment records)
 *   - "Patients"      (sheet for patient profiles)
 *
 * All functions are no-ops when Google is not configured, ensuring the
 * live site is never disrupted by missing credentials.
 *
 * Row column layout:
 * Appointments: Record ID | Patient Name | Date | Time | Duration (min) | Type | Status | Notes
 * Patients:     Record ID | First Name | Last Name | Email | Phone | DOB | Gender | Medical History
 */

import { authHeader, getGoogleConfig, isGoogleConfigured } from './googleAuth'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

export const SHEET_APPOINTMENTS = 'Appointments'
export const SHEET_PATIENTS = 'Patients'

export interface AppointmentRow {
  recordId: string
  patientName: string
  date: string
  time: string
  durationMinutes: number
  type: string
  status: string
  notes: string
}

export interface PatientRow {
  recordId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  medicalHistory: string
}

async function getSheetValues(sheetName: string): Promise<string[][]> {
  if (!isGoogleConfigured()) return []
  try {
    const config = getGoogleConfig()!
    const headers = await authHeader()
    const range = encodeURIComponent(sheetName)
    const url = SHEETS_API + '/' + config.spreadsheetId + '/values/' + range
    const res = await fetch(url, { headers: { ...headers } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.values ?? []) as string[][]
  } catch (error) {
    console.error('[GoogleSheets] getSheetValues error:', error)
    return []
  }
}

async function appendRow(sheetName: string, values: (string | number)[]): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const config = getGoogleConfig()!
    const headers = await authHeader()
    const range = encodeURIComponent(sheetName)
    const url =
      SHEETS_API + '/' + config.spreadsheetId +
      '/values/' + range + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    })
    return res.ok
  } catch (error) {
    console.error('[GoogleSheets] appendRow error:', error)
    return false
  }
}

async function updateRow(
  sheetName: string,
  rowIndex: number,
  values: (string | number)[],
): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const config = getGoogleConfig()!
    const headers = await authHeader()
    const colEnd = String.fromCharCode(65 + values.length - 1)
    const range = encodeURIComponent(sheetName + '!A' + rowIndex + ':' + colEnd + rowIndex)
    const url =
      SHEETS_API + '/' + config.spreadsheetId +
      '/values/' + range + '?valueInputOption=USER_ENTERED'
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    })
    return res.ok
  } catch (error) {
    console.error('[GoogleSheets] updateRow error:', error)
    return false
  }
}

async function clearRow(sheetName: string, rowIndex: number): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const config = getGoogleConfig()!
    const headers = await authHeader()
    const range = encodeURIComponent(sheetName + '!A' + rowIndex + ':Z' + rowIndex)
    const url = SHEETS_API + '/' + config.spreadsheetId + '/values/' + range + ':clear'
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return res.ok
  } catch (error) {
    console.error('[GoogleSheets] clearRow error:', error)
    return false
  }
}

async function findRowByRecordId(sheetName: string, recordId: string): Promise<number> {
  const values = await getSheetValues(sheetName)
  for (let i = 0; i < values.length; i++) {
    if (values[i]?.[0] === recordId) return i + 1
  }
  return -1
}

/**
 * Ensures both sheets have their header rows.
 * Safe to call multiple times - skips if headers already exist.
 */
export async function initSheetHeaders(): Promise<void> {
  if (!isGoogleConfigured()) return

  const apptValues = await getSheetValues(SHEET_APPOINTMENTS)
  if (!apptValues.length || apptValues[0]?.[0] !== 'Record ID') {
    await appendRow(SHEET_APPOINTMENTS, [
      'Record ID', 'Patient Name', 'Date', 'Time', 'Duration (min)', 'Type', 'Status', 'Notes',
    ])
  }

  const patientValues = await getSheetValues(SHEET_PATIENTS)
  if (!patientValues.length || patientValues[0]?.[0] !== 'Record ID') {
    await appendRow(SHEET_PATIENTS, [
      'Record ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Medical History',
    ])
  }
}

function appointmentRowValues(row: AppointmentRow): (string | number)[] {
  return [
    row.recordId,
    row.patientName,
    row.date,
    row.time,
    row.durationMinutes,
    row.type,
    row.status,
    row.notes,
  ]
}

/** Appends or updates an appointment row in the Appointments sheet. */
export async function upsertAppointmentRow(row: AppointmentRow): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const existing = await findRowByRecordId(SHEET_APPOINTMENTS, row.recordId)
    if (existing > 0) return updateRow(SHEET_APPOINTMENTS, existing, appointmentRowValues(row))
    return appendRow(SHEET_APPOINTMENTS, appointmentRowValues(row))
  } catch (error) {
    console.error('[GoogleSheets] upsertAppointmentRow error:', error)
    return false
  }
}

/** Clears the appointment row matching the given Supabase record ID. */
export async function deleteAppointmentRow(recordId: string): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const rowIndex = await findRowByRecordId(SHEET_APPOINTMENTS, recordId)
    if (rowIndex < 0) return true
    return clearRow(SHEET_APPOINTMENTS, rowIndex)
  } catch (error) {
    console.error('[GoogleSheets] deleteAppointmentRow error:', error)
    return false
  }
}

function patientRowValues(row: PatientRow): (string | number)[] {
  return [
    row.recordId,
    row.firstName,
    row.lastName,
    row.email,
    row.phone,
    row.dateOfBirth,
    row.gender,
    row.medicalHistory,
  ]
}

/** Appends or updates a patient row in the Patients sheet. */
export async function upsertPatientRow(row: PatientRow): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const existing = await findRowByRecordId(SHEET_PATIENTS, row.recordId)
    if (existing > 0) return updateRow(SHEET_PATIENTS, existing, patientRowValues(row))
    return appendRow(SHEET_PATIENTS, patientRowValues(row))
  } catch (error) {
    console.error('[GoogleSheets] upsertPatientRow error:', error)
    return false
  }
}

/** Clears the patient row matching the given Supabase record ID. */
export async function deletePatientRow(recordId: string): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    const rowIndex = await findRowByRecordId(SHEET_PATIENTS, recordId)
    if (rowIndex < 0) return true
    return clearRow(SHEET_PATIENTS, rowIndex)
  } catch (error) {
    console.error('[GoogleSheets] deletePatientRow error:', error)
    return false
  }
}
