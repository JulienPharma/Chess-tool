import { describe, it, expect } from 'vitest'
import { authErrorMessage } from '../src/lib/authErrors'

describe('authErrorMessage', () => {
  it('traduit un mauvais mot de passe', () => {
    expect(authErrorMessage('Invalid login credentials')).toBe('E-mail ou mot de passe incorrect.')
  })

  it('explique quoi faire quand l’e-mail n’est pas confirmé', () => {
    expect(authErrorMessage('Email not confirmed')).toContain('Confirm email')
  })

  it('oriente vers la connexion si le compte existe déjà', () => {
    expect(authErrorMessage('User already registered')).toContain('connecte-toi')
  })

  it('signale les inscriptions désactivées', () => {
    expect(authErrorMessage('Signups not allowed for this instance')).toContain('inscriptions')
  })

  it('est insensible à la casse', () => {
    expect(authErrorMessage('INVALID LOGIN CREDENTIALS')).toBe('E-mail ou mot de passe incorrect.')
  })

  it('laisse passer un message inconnu tel quel', () => {
    expect(authErrorMessage('Quelque chose d’inattendu')).toBe('Quelque chose d’inattendu')
  })
})
