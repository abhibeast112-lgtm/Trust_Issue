# Security Finding: SQL Injection

## Vulnerability
The vulnerable search endpoint builds SQL by interpolating user-controlled
input directly into the query string.

## Affected endpoint
GET /api/search/lab/vulnerable?username=<input>

## Reproduction
With a valid authenticated session, submit this username:

' OR '1'='1' --

The vulnerable endpoint returned multiple user records, including
testmember and testbob, instead of restricting results to one username.

## Root cause
The application treats untrusted input as part of the SQL statement.
The injected OR condition changes the query's logic.

## Impact
An attacker with access to the vulnerable endpoint could manipulate
search conditions and retrieve records beyond the intended match.

## Remediation
The secure endpoint uses a parameterized query with a placeholder:
WHERE username = ?

The database treats the supplied value as data rather than SQL syntax.

## Verification
The vulnerable endpoint returned multiple users for the test payload.
The secure endpoint returned an empty users array for the same payload.

## Scope and limitations
This demonstration was performed against a local test database with
non-sensitive sample accounts. It does not establish the impact of
SQL injection against any production system.
