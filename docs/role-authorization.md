# Security Finding: Broken Role Authorization

## Vulnerability
The vulnerable event-creation endpoint checks that a user is logged in
but does not verify that the user has the admin role.

## Affected endpoints
POST /api/events/lab/vulnerable
POST /api/events/secure

## Reproduction
Authenticate as testmember, whose role is member.
Submit an event title and description to the vulnerable endpoint.

The vulnerable endpoint returned HTTP 201 Created.
The secure endpoint returned HTTP 403 Forbidden for the same member.

## Root cause
Authentication establishes who the user is. It does not establish
that the user is authorized to perform every action.

## Impact
Ordinary members could perform an action intended to be restricted
to administrators, such as creating events.

## Remediation
The secure endpoint uses server-side authorization middleware that
checks the authenticated session's role against admin.

The application must not trust a role supplied by the client.

## Verification
The member's request succeeded on the vulnerable endpoint and was
rejected on the secure endpoint.

## Scope and limitations
Testing was performed locally using a member account and sample data.
The vulnerable endpoint is intended only for the security lab and
must not be exposed in production.
