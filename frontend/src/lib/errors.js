const MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Cannot reach the server. Check your connection and try again.',
  'permission-denied': 'You do not have permission to do that.',
  unavailable: 'Cannot reach the server. Check your connection and try again.',
};

/** Turns Firebase errors into messages a citizen can act on. */
export function friendlyError(err) {
  return MESSAGES[err?.code] || (err?.code ? `Something went wrong (${err.code}).` : err?.message || 'Something went wrong.');
}
