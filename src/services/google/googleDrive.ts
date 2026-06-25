/**
 * Google Drive file operations for Clinicmx patient files.
 *
 * Provides upload, list, and delete helpers that organise files under a
 * per-patient subfolder inside the root Drive folder defined by
 * VITE_GOOGLE_DRIVE_FOLDER_ID.
 *
 * All functions return null / [] when Google is not configured so the rest of
 * the app continues working with Supabase Storage as the primary store.
 *
 * Folder hierarchy in Drive:
 *   <VITE_GOOGLE_DRIVE_FOLDER_ID>/
 *     <patient-uuid>/
 *       profile_photo/   <-- file category
 *       clinical_image/
 *       xray_image/
 */

import { authHeader, getGoogleConfig, isGoogleConfigured } from './googleAuth'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FileCategory = 'profile_photo' | 'clinical_image' | 'xray_image'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  webContentLink: string
  /** Drive folder that contains this file (category subfolder ID). */
  parents: string[]
}

export interface DriveUploadResult {
  driveFileId: string
  webViewLink: string
  webContentLink: string
}

// ---------------------------------------------------------------------------
// Folder helpers
// ---------------------------------------------------------------------------

/**
 * Finds or creates a Drive folder with the given name inside parentId.
 * Returns the folder ID.
 */
async function ensureFolder(name: string, parentId: string): Promise<string> {
  const headers = await authHeader()

  // Escape backslashes first, then single quotes, to build a safe Drive query.
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  // Search for an existing folder.
  const q = encodeURIComponent(
    'mimeType=\'application/vnd.google-apps.folder\' and ' +
    'name=\'' + safeName + '\' and ' +
    '\'' + parentId + '\' in parents and ' +
    'trashed=false',
  )
  const searchRes = await fetch(DRIVE_API + '/files?q=' + q + '&fields=files(id,name)', {
    headers: { ...headers },
  })
  if (!searchRes.ok) throw new Error('Drive folder search failed: ' + await searchRes.text())

  const searchData = await searchRes.json()
  const existing = searchData.files?.[0]
  if (existing) return existing.id as string

  // Create the folder.
  const createRes = await fetch(DRIVE_API + '/files', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  if (!createRes.ok) throw new Error('Drive folder creation failed: ' + await createRes.text())

  const folder = await createRes.json()
  return folder.id as string
}

/**
 * Returns the Drive folder ID for a patient + category combination,
 * creating intermediate folders when they do not yet exist.
 */
async function getPatientCategoryFolderId(
  patientId: string,
  category: FileCategory,
): Promise<string> {
  const config = getGoogleConfig()
  if (!config) throw new Error('Google not configured')

  const patientFolderId = await ensureFolder(patientId, config.driveFolderId)
  return ensureFolder(category, patientFolderId)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Uploads a File object to Google Drive inside the appropriate patient /
 * category subfolder.
 *
 * Returns null when Google is not configured (graceful fallback).
 */
export async function uploadFileToDrive(
  file: File,
  patientId: string,
  category: FileCategory,
): Promise<DriveUploadResult | null> {
  if (!isGoogleConfigured()) return null

  try {
    const folderId = await getPatientCategoryFolderId(patientId, category)
    const headers = await authHeader()

    // Build multipart/related body.
    const boundary = '---GoogleDriveBoundary' + Date.now()
    const metadata = JSON.stringify({ name: file.name, parents: [folderId] })

    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    const metaPart = '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata + '\r\n'
    const metaBytes = new TextEncoder().encode(metaPart)

    const contentPart = '--' + boundary + '\r\n' +
      'Content-Type: ' + file.type + '\r\n\r\n'
    const contentPartBytes = new TextEncoder().encode(contentPart)

    const closing = '\r\n--' + boundary + '--'
    const closingBytes = new TextEncoder().encode(closing)

    const body = new Uint8Array(
      metaBytes.length + contentPartBytes.length + fileBytes.length + closingBytes.length,
    )
    let offset = 0
    body.set(metaBytes, offset); offset += metaBytes.length
    body.set(contentPartBytes, offset); offset += contentPartBytes.length
    body.set(fileBytes, offset); offset += fileBytes.length
    body.set(closingBytes, offset)

    const uploadRes = await fetch(
      DRIVE_UPLOAD_API + '/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,parents',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'multipart/related; boundary=' + boundary,
        },
        body,
      },
    )

    if (!uploadRes.ok) throw new Error('Drive upload failed: ' + await uploadRes.text())

    const driveFile: DriveFile = await uploadRes.json()
    return {
      driveFileId: driveFile.id,
      webViewLink: driveFile.webViewLink,
      webContentLink: driveFile.webContentLink,
    }
  } catch (error) {
    console.error('[GoogleDrive] uploadFileToDrive error:', error)
    return null
  }
}

/**
 * Deletes a file from Google Drive by its file ID.
 * Returns true on success, false when Google is not configured or on error.
 */
export async function deleteFileFromDrive(driveFileId: string): Promise<boolean> {
  if (!isGoogleConfigured()) return false

  try {
    const headers = await authHeader()
    const res = await fetch(DRIVE_API + '/files/' + driveFileId, {
      method: 'DELETE',
      headers: { ...headers },
    })
    // 204 No Content is success; 404 is also fine (already gone).
    return res.status === 204 || res.status === 404
  } catch (error) {
    console.error('[GoogleDrive] deleteFileFromDrive error:', error)
    return false
  }
}

/**
 * Lists all files inside a patient's Drive folder (all categories).
 * Returns an empty array when Google is not configured.
 */
export async function listPatientFiles(patientId: string): Promise<DriveFile[]> {
  if (!isGoogleConfigured()) return []

  try {
    const config = getGoogleConfig()!
    // Find patient folder (do not create it if missing).
    const headers = await authHeader()

    const q = encodeURIComponent(
      'mimeType=\'application/vnd.google-apps.folder\' and ' +
      'name=\'' + patientId + '\' and ' +
      '\'' + config.driveFolderId + '\' in parents and ' +
      'trashed=false',
    )
    const folderRes = await fetch(DRIVE_API + '/files?q=' + q + '&fields=files(id)', {
      headers: { ...headers },
    })
    if (!folderRes.ok) return []

    const folderData = await folderRes.json()
    const patientFolder = folderData.files?.[0]
    if (!patientFolder) return []

    const filesQ = encodeURIComponent(
      '\'' + patientFolder.id + '\' in parents and trashed=false',
    )
    const filesRes = await fetch(
      DRIVE_API + '/files?q=' + filesQ + '&fields=files(id,name,mimeType,webViewLink,webContentLink,parents)',
      { headers: { ...headers } },
    )
    if (!filesRes.ok) return []

    const filesData = await filesRes.json()
    return (filesData.files ?? []) as DriveFile[]
  } catch (error) {
    console.error('[GoogleDrive] listPatientFiles error:', error)
    return []
  }
}

/**
 * Returns the web-viewable URL for a Drive file by ID.
 * Useful for displaying images stored in Drive.
 */
export function getDriveFileViewUrl(driveFileId: string): string {
  return 'https://drive.google.com/file/d/' + driveFileId + '/view'
}

/**
 * Returns a direct download URL for a Drive file.
 * Note: works only when the file has been shared publicly or the viewer
 * is authenticated with the Drive account.
 */
export function getDriveFileDownloadUrl(driveFileId: string): string {
  return 'https://drive.google.com/uc?export=download&id=' + driveFileId
}
