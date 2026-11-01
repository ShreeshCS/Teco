import { describe, it, expect } from 'vitest'
import { signAccessToken, verifyAccessToken } from '@/lib/jwt.js'

describe('jwt.lib', () => {
  const payload = {
    userId: 'user-xyz',
    email: 'user@example.com',
  }

  it('should sign and verify a valid access token', () => {
    const token = signAccessToken(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
  })

  it('should throw an error when verifying an invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.signature')).toThrow()
  })
})

