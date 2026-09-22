export class EmailAlreadyExistsError extends Error {
  constructor(message = 'An account with this email already exists.') {
    super(message);
    this.name = 'EmailAlreadyExistsError';
  }
}

// Domain error for invalid authentication attempts
export class AuthenticationError extends Error {
  constructor(message = 'Invalid email or password') {
    super(message)
    this.name = 'AuthenticationError'
  }
}