import { useState, useEffect } from 'react'
import { Plus, Search, FileText, Trash2, Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

// ─── LOCAL MEMORY HELPERS (NEW) ─────────────────────────────
const LOCAL_MEDS_KEY = 'clinicmx_local_medications'
const LOCAL_INVS_KEY = 'clinicmx_local_investigations'

function getLocalItems(key: string): any[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function saveLocalItem(key: string, item: any) {
  const items = getLocalItems(key)
  const exists = items.some(
    (i: any) => i.name?.toLowerCase() === item.name?.toLowerCase()
  )
  if (!exists && item.name?.trim()) {
    localStorage.setItem(key, JSON.stringify([item, ...items].slice(0, 30)))
  }
}

function removeLocalItem(key: string, name: string) {
  const items = getLocalItems(key).filter(
    (i: any) => i.name?.toLowerCase() !== name.toLowerCase()
  )
  localStorage.setItem(key, JSON.stringify(items))
}
// ─────────────────────────────────────────────────────────────

export function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [medicationTemplates, setMedicationTemplates] = useState<any[]>([])
  const [investigationTemplates, setInvestigationTemplates] = useState<any[]>([])
  const [loading, setLoading] = use
