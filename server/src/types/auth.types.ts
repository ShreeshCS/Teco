export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SafeUserDetails {
  id: string
  name: string
  email: string
  createdAt: Date
}

export interface LoginResponseDetails {
  id: string
  email: string
}
