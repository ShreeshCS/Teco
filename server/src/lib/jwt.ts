import jwt, { SignOptions } from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback-dev-secret-do-not-use-in-prod'
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '1D'

/**
 * Signs a new JWT for an authenticated user
 */
export const signAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  }

  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * Synchronously or asynchronously verifies a JWT
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}
