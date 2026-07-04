import clinicConfig from '@/config/clinic.json'

const APP_AUTH_STORAGE_KEY = clinicConfig.storageKeys.auth
const APP_ROLE_STORAGE_KEY = clinicConfig.storageKeys.role
const APP_ACTOR_STORAGE_KEY = clinicConfig.storageKeys.actorId

export type AppRole = 'doctor' | 'operator'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function isAppAuthenticated() {
  return canUseStorage() && localStorage.getItem(APP_AUTH_STORAGE_KEY) === 'true'
}

export function getAppRole(): AppRole | null {
  if (!canUseStorage()) return null
  const role = localStorage.getItem(APP_ROLE_STORAGE_KEY)
  return role === 'doctor' || role === 'operator' ? role : null
}

export function setAppRole(role: AppRole) {
  if (!canUseStorage()) return
  localStorage.setItem(APP_ROLE_STORAGE_KEY, role)
}

export function clearAppRole() {
  if (!canUseStorage()) return
  localStorage.removeItem(APP_ROLE_STORAGE_KEY)
}

export function canDelete() {
  return getAppRole() === 'doctor'
}

export function getOrCreateAppActorId() {
  if (!canUseStorage()) return 'sk-dental-local'

  let actorId = localStorage.getItem(APP_ACTOR_STORAGE_KEY)
  if (actorId) return actorId

  actorId = globalThis.crypto?.randomUUID?.() || `sk-dental-${Date.now()}-${Math.random().toString(16).slice(2)}`
  localStorage.setItem(APP_ACTOR_STORAGE_KEY, actorId)
  return actorId
}

export function getScopedStorageKey(prefix: string) {
  return `${prefix}:${getOrCreateAppActorId()}`
}
