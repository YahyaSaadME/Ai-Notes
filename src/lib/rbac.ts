import type { TokenPayload, UserRole } from './auth'
import { normalizeRole } from './auth'

const ADMIN_PANEL_ROLES: UserRole[] = ['admin', 'owner', 'manager']

export function roleOf(payload: TokenPayload): UserRole {
  return normalizeRole(payload.role)
}

export function hasRole(payload: TokenPayload, allowed: UserRole[]): boolean {
  const role = roleOf(payload)
  return allowed.includes(role)
}

export function canAccessAdminPanel(payload: TokenPayload): boolean {
  return hasRole(payload, ADMIN_PANEL_ROLES)
}

export function canCreateNote(payload: TokenPayload): boolean {
  return !hasRole(payload, ['viewer'])
}

export function getNoteReadScope(payload: TokenPayload): Record<string, unknown> {
  const role = roleOf(payload)
  const email = payload.email.toLowerCase()

  if (['admin', 'owner', 'manager'].includes(role)) {
    return {}
  }

  return {
    $or: [
      { createdby: email },
      { assignedTo: email },
      { visibility: 'org' },
    ],
  }
}

export function getNoteUpdateScope(payload: TokenPayload): Record<string, unknown> | null {
  const role = roleOf(payload)
  const email = payload.email.toLowerCase()

  if (['admin', 'owner', 'manager'].includes(role)) {
    return {}
  }

  if (['operator', 'user'].includes(role)) {
    return {
      $or: [{ createdby: email }, { assignedTo: email }],
    }
  }

  return null
}

export function getNoteDeleteScope(payload: TokenPayload): Record<string, unknown> | null {
  const role = roleOf(payload)
  const email = payload.email.toLowerCase()

  if (['admin', 'owner', 'manager'].includes(role)) {
    return {}
  }

  if (['operator', 'user'].includes(role)) {
    return { createdby: email }
  }

  return null
}
