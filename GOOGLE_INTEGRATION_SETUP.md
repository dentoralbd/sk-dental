# Google Integration Setup Guide

This guide walks you through enabling the optional Google Drive + Google Sheets
hybrid integration for SK Dental. The integration is **additive** — your
existing Supabase setup continues to work even if you skip this entirely.

---

## What you will set up

| Feature | Where |
|---|---|
| Patient file uploads (images, X-rays) | **Google Drive** |
| Appointment data backup | **Google Sheets** ("Appointments" tab) |
| Patient profile backup | **Google Sheets** ("Patients" tab) |

---

## Prerequisites

- A Google account (personal Gmail or Google Workspace)
- Access to [Google Cloud Console](https://console.cloud.google.com)

---

## Step 1 — Create a Google Cloud Project

1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Click the project selector drop-down at the top and choose **New Project**.
3. Give it a name (e.g. `sk-dental-integration`) and click **Create**.

---

## Step 2 — Enable the required APIs

1. In the left sidebar go to **APIs & Services > Library**.
2. Search for and enable each of the following APIs:
   - **Google Drive API**
   - **Google Sheets API**

---

## Step 3 — Create a Service Account

1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > Service account**.
3. Fill in a name (e.g. `sk-dental-service`) and click **Create and Continue**.
4. Grant the role **Editor** (or narrow it to the two APIs above) and click
   **Continue**, then **Done**.

---

## Step 4 — Download the JSON Key

1. On the Credentials page, click the service account you just created.
2. Go to the **Keys** tab.
3. Click **Add Key > Create new key**, choose **JSON**, and click **Create**.
4. A `.json` file will download.  **Keep it safe — treat it like a password.**

The file looks like:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "sk-dental-service@your-project.iam.gserviceaccount.com",
  ...
}
```

You need two values from this file:
- `client_email`  → `VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key`   → `VITE_GOOGLE_PRIVATE_KEY`

---

## Step 5 — Set up Google Drive

1. Open [Google Drive](https://drive.google.com) in your browser.
2. Create a new folder, e.g. **"SK Dental Patient Files"**.
3. Right-click the folder > **Share**.
4. Paste the service account email (from the JSON key `client_email` field)
   and give it **Editor** access.  Click **Send** (ignore the "external user"
   warning).
5. Open the folder; copy its **ID** from the browser URL:
   ```
   https://drive.google.com/drive/folders/<FOLDER_ID_HERE>
   ```
6. Save this as `VITE_GOOGLE_DRIVE_FOLDER_ID` in your `.env` file.

---

## Step 6 — Set up Google Sheets

1. Open [Google Sheets](https://sheets.google.com) and create a new spreadsheet
   named **"SK Dental Backup"** (or any name you prefer).
2. Rename the first tab to **`Appointments`**.
3. Add a second tab named **`Patients`**.
4. Share the spreadsheet with the service account email (Editor access) the same
   way you did for the Drive folder.
5. Copy the spreadsheet **ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID_HERE>/edit
   ```
6. Save this as `VITE_GOOGLE_SPREADSHEET_ID` in your `.env` file.

> The header rows will be written automatically the first time a sync runs.

---

## Step 7 — Configure environment variables

Copy `.env.example` to `.env` and fill in the four new Google variables:

```env
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=sk-dental-service@your-project.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
VITE_GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
VITE_GOOGLE_SPREADSHEET_ID=1BxCdEfGhIjKlMnOpQrStUvWxYz
```

**Important — private key formatting:**
Copy the `private_key` value from the JSON file exactly as-is.  The value
already contains literal `\n` sequences.  If your hosting provider (Netlify,
Cloudflare Pages, etc.) shows the value in a single-line input, paste the key
as-is — the code will handle the escaping automatically.

---

## Step 8 — Deploy

For **Netlify**:
1. Open your site > **Site settings > Environment variables**.
2. Add each `VITE_GOOGLE_*` variable.
3. Trigger a new deploy.

For **Cloudflare Pages**:
1. Open your project > **Settings > Environment variables**.
2. Add each variable under **Production**.
3. Redeploy.

---

## How the integration works

### Patient file uploads (Google Drive)

Import and call `uploadFileToDrive()` from
`src/services/google/googleDrive.ts` alongside the existing Supabase upload.

```ts
import { uploadFileToDrive } from '@/services/google/googleDrive'

// After the existing Supabase upload succeeds:
const driveResult = await uploadFileToDrive(file, patientId, fileCategory)
if (driveResult) {
  // Optionally store driveResult.driveFileId in the patient_files table
  console.log('Also backed up to Drive:', driveResult.webViewLink)
}
```

### Appointment sync

Call the sync helper after every create/update/delete in Supabase:

```ts
import { syncAppointmentToSheets } from '@/services/sync/appointmentSync'

await syncAppointmentToSheets({
  id: appointment.id,
  patientName: patient.first_name + ' ' + patient.last_name,
  date_time: appointment.date_time,
  duration: appointment.duration,
  type: appointment.type,
  status: appointment.status,
  notes: appointment.notes,
})
```

### Patient profile sync

```ts
import { syncPatientToSheets } from '@/services/sync/patientSync'

await syncPatientToSheets({
  id: patient.id,
  first_name: patient.first_name,
  last_name: patient.last_name,
  email: patient.email,
  phone: patient.phone,
  date_of_birth: patient.date_of_birth,
  gender: patient.gender,
  medical_history: patient.medical_history,
})
```

All sync functions are silent no-ops when the Google env vars are absent,
so the calls are safe to add to your existing page handlers without any
conditional guards.

---

## Security considerations

The `VITE_*` prefix causes Vite to embed variables in the JavaScript bundle
delivered to the browser, which means the service account credentials will be
visible to anyone who inspects your site's network traffic or source files.

This is acceptable for a **single-clinic self-hosted deployment** where:
- The site is not publicly accessible, or
- You trust everyone who can view the source.

For a **multi-tenant or public-facing** setup, move the Google API calls to a
serverless function (Cloudflare Worker, Netlify Function, etc.) that runs
server-side and keep the private key out of the frontend bundle entirely.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Google calls silently do nothing | Check that all four `VITE_GOOGLE_*` vars are set |
| `Failed to obtain Google access token` | Verify the private key is correctly formatted (real `\n` newlines, not escaped) |
| `Drive upload failed: 403` | Re-share the Drive folder with the service account email (Editor) |
| `Sheets append failed: 403` | Re-share the Spreadsheet with the service account email (Editor) |
| Build error after adding variables | Run `npm run build` and check for TypeScript errors |

---

## File reference

| File | Purpose |
|---|---|
| `src/services/google/googleAuth.ts` | JWT token generation & caching |
| `src/services/google/googleDrive.ts` | Drive upload, delete, list |
| `src/services/google/googleSheets.ts` | Sheets append, update, delete rows |
| `src/services/sync/appointmentSync.ts` | Appointment -> Sheets sync helpers |
| `src/services/sync/patientSync.ts` | Patient -> Sheets sync helpers |
