# Security Specification - Usman Mobile Repairing Centre

## Data Invariants
1. Products can be read by any public visitor so the catalog is visible, but write/update/delete operations require authenticated admin access.
2. Repair tickets can be looked up by token for public repair status queries, but creating, updating, or deleting tickets requires admin credentials.
3. Orders can be submitted by customers (public create with required contact and total amount bounds), but order listing and status updates are restricted to store admins.
4. Admin records can only be read/managed by verified administrators whose document ID matches `request.auth.uid`.

## The "Dirty Dozen" Attack Vectors Prevented
1. Public unauthorized product deletion or price zeroing.
2. Setting fake huge discount prices (e.g., negative or non-numeric types).
3. Privilege escalation (ordinary user attempting to self-appoint as an admin).
4. Customer changing repair status from 'received' to 'delivered' without repair payment.
5. Injected script or 1MB string payload in customer notes or device name.
6. Order modification or deletion by unauthorized clients.
7. Attempting to overwrite immortal timestamps like createdAt.
8. Query poisoning with illegal string IDs longer than 128 chars.
9. Cross-collection spoofing with invalid path parameters.
10. Email spoofing with unverified email tokens.
11. Reading private admin list without authentication.
12. Bulk querying internal orders without admin permissions.
