// MyFitnessPal-style account rules.
// Password: 8+ characters, at least one letter and one number.
// Username: 3–30 chars, letters/numbers and . _ - (their public handle).

export function passwordError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter.'
  if (!/[0-9]/.test(password)) return 'Include at least one number.'
  return null
}

export function usernameError(username: string): string | null {
  const u = username.trim()
  if (u.length < 3) return 'Username must be at least 3 characters.'
  if (u.length > 30) return 'Username must be 30 characters or fewer.'
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) return 'Use only letters, numbers, and . _ -'
  return null
}
