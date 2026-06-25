/**
 * Appointment sync helpers for Google Sheets.
 *
 * Call syncAppointmentToSheets() after creating or updating an appointment
 * in Supabase.  Call removeAppointmentFromSheets() after deleting one.
 *
 * Both functions are no-ops when Google is not configured, so the existing
 * Supabase-only workflow remains completely intact.
 */

import { format, parseISO } from 'date-fns'
import { isGoogleConfigured } from '../google/googleAuth'
import {
  upsertAppointmentRow,
  deleteAppointmentRow,
  type AppointmentRow,
} from '../google/googleSheets'

export interface AppointmentSyncPayload {
  id: string
  patientName: string   // first_name + ' ' + last_name from the joined patients row
  date_time: string     // ISO 8601 string from Supabase
  duration: number      // minutes
  type: string
  status: string
  notes: string | null
}

function buildAppointmentRow(appt: AppointmentSyncPayload): AppointmentRow {
  const dt = parseISO(appt.date_time)
  return {
    recordId: appt.id,
    patientName: appt.patientName,
    date: format(dt, 'yyyy-MM-dd'),
    time: format(dt, 'HH:mm'),
    durationMinutes: appt.duration,
    type: appt.type,
    status: appt.status,
    notes: appt.notes ?? '',
  }
}

/**
 * Syncs a single appointment to the Google Sheets "Appointments" tab.
 * Creates a new row or updates the existing one matched by record ID.
 *
 * Returns true on success, false when Google is not configured or on error.
 */
export async function syncAppointmentToSheets(
  appt: AppointmentSyncPayload,
): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    return await upsertAppointmentRow(buildAppointmentRow(appt))
  } catch (error) {
    console.error('[AppointmentSync] syncAppointmentToSheets error:', error)
    return false
  }
}

/**
 * Removes an appointment row from the Google Sheets "Appointments" tab.
 *
 * Returns true on success, false when Google is not configured or on error.
 */
export async function removeAppointmentFromSheets(appointmentId: string): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  try {
    return await deleteAppointmentRow(appointmentId)
  } catch (error) {
    console.error('[AppointmentSync] removeAppointmentFromSheets error:', error)
    return false
  }
}
