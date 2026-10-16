### Verified test results

Tested locally on 16 October 2026.

- Authenticated as `testmember` (user ID 1).
- Requested `/api/registrations/lab/vulnerable/users/2`.
- Result: HTTP 200; returned Bob's registration for
  `Security Lab Workshop`.
- Requested `/api/registrations/secure/users/2`.
- Result: HTTP 403 Forbidden.

Conclusion: the vulnerable route checks authentication but not
resource ownership. The secure route enforces ownership using
the authenticated session's user ID.
