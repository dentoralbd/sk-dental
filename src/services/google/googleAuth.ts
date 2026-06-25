/**
 * Google API Authentication using Service Account credentials.
 *
 * This module generates a short-lived OAuth2 access token from a Google
 * service account JSON key using the Web Crypto API (RS256 JWT flow).
 *
 * SECURITY NOTE:
 *   - In production, do NOT embed the private key in a client-side bundle.
 *     Prefer calling a Cloudflare Worker / Netlify Function that holds the
 *     credentials securely and proxies Drive/Sheets API requests.
 *   - For local development or a single-user self-hosted setup you can put
 *     the credentials in .env (not VITE_-prefixed so they stay server-side),
 *     or use VITE_-prefixed variables only if you accept the exposure risk.
 *   - The helper isGoogleConfigured() lets callers silently skip Google sync
 *     when credentials are absent, so the live site is never disrupted.
 *
 * Environment variables (all optional):
 *   VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL  - service account client_email
 *   VITE_GOOGLE_PRIVATE_KEY            - PEM private key (\n-escaped)
 *   VITE_GOOGLE_DRIVE_FOLDER_ID        - root Drive folder for patient files
 *   VITE_GOOGLE_SPREADSHEET_ID         - target Google Spreadsheet ID
 */

const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ')

/** Cached token and its expiry time (epoch seconds). */
let _cachedToken: string | null = null
let _tokenExpiresAt = 0

export interface GoogleConfig {
  serviceAccountEmail: string
  privateKeyPem: string
  /** Root Drive folder ID where patient subfolders will be created. */
  driveFolderId: string
  /** Google Spreadsheet ID used for Appointments / Patients sheets. */
  spreadsheetId: string
}

/**
 * Returns the Google integration config from environment variables.
 * Returns null when any required credential is missing.
 */
export function getGoogleConfig(): GoogleConfig | null {
  const email = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = import.meta.env.VITE_GOOGLE_PRIVATE_KEY
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID
  const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID

  if (!email || !key || !folderId || !spreadsheetId) return null

  // Vite env vars preserve literal \n; convert them to real newlines.
  const privateKeyPem = key.replace(/\\n/g, '\n')

  return { serviceAccountEmail: email, privateKeyPem, driveFolderId: folderId, spreadsheetId }
}

/** Returns true when all required Google env vars are present. */
export function isGoogleConfigured(): boolean {
  return getGoogleConfig() !== null
}

// ---------------------------------------------------------------------------
// JWT helpers (Web Crypto / RS256)
// ---------------------------------------------------------------------------

function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function encodeJwtPart(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj)
  const encoded = new TextEncoder().encode(json)
  return base64urlEncode(encoded)
}

/**
 * Strips PEM armour and decodes the raw DER bytes of a PKCS#8 private key.
 */
function pemToDer(pem: string): ArrayBuffer {
  const lines = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binary = atob(lines)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/**
 * Creates and signs a service-account JWT then exchanges it for an
 * OAuth2 bearer access token from Google.
 *
 * The token is cached until 60 s before its expiry to avoid rate limits.
 */
export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (_cachedToken && now < _tokenExpiresAt - 60) return _cachedToken

  const config = getGoogleConfig()
  if (!config) throw new Error('Google credentials are not configured.')

  const header = encodeJwtPart({ alg: 'RS256', typ: 'JWT' })
  const expiry = now + 3600
  const payload = encodeJwtPart({
    iss: config.serviceAccountEmail,
    scope: GOOGLE_SCOPES,
    aud: GOOGLE_TOKEN_URI,
    exp: expiry,
    iat: now,
  })

  const signingInput = header + '.' + payload
  const keyData = pemToDer(config.privateKeyPem)

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const jwt = signingInput + '.' + base64urlEncode(signature)

  const response = await fetch(GOOGLE_TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error('Failed to obtain Google access token: ' + err)
  }

  const tokenData = await response.json()
  _cachedToken = tokenData.access_token as string
  _tokenExpiresAt = now + ((tokenData.expires_in as number) ?? 3600)
  return _cachedToken as string
}

/** Builds an Authorization header object for Google API requests. */
export async function authHeader(): Promise<{ Authorization: string }> {
  const token = await getAccessToken()
  return { Authorization: 'Bearer ' + token }
}
