cat > docs/idor.md <<'EOF'
# IDOR / Broken Access Control Demonstration

## Vulnerability
The vulnerable endpoint accepts a user ID from the URL and retrieves
that user's registrations without checking whether the authenticated
user owns those records.

## Vulnerable endpoint
GET /api/registrations/lab/vulnerable/users/:userId

## Secured endpoint
GET /api/registrations/secure/users/:userId

## Reproduction
1. Register two users.
2. Log in as the first user and save the session cookie.
3. Request the vulnerable endpoint using the second user's ID.
4. Observe that the server returns HTTP 200.
5. Repeat the request against the secured endpoint.
6. Observe HTTP 403 Forbidden.

## Root cause
The vulnerable endpoint checks authentication but does not enforce
resource ownership.

## Impact
An authenticated user could potentially read another user's
registration records if records exist.

## Remediation
The secured endpoint compares the requested user ID with the ID
stored in the authenticated session and rejects mismatches.

## Verification
The vulnerable endpoint returned HTTP 200 for a cross-user request.
The secured endpoint returned HTTP 403 for the same request.

## Limitation
The current demonstration returned an empty registration list.
Actual record disclosure should be demonstrated using controlled
sample data before claiming data exposure was directly observed.

## Safety
This demonstration is intended for the local development lab only.
EOF