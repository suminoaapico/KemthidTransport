# Security Specification & Payload-First Security TDD

## 1. Data Invariants
1. **Strict Authentication & Email Verification**: All reads and writes require an authenticated Firebase user with `request.auth.token.email_verified == true`. Unauthenticated access is globally denied.
2. **Ownership & Admin Isolation**: Every operational record carries an immutable `ownerId` matching `request.auth.uid` on create. Non-admin users can only read, list, update, or delete records where `resource.data.ownerId == request.auth.uid`. Bootstrapped admin (`artkitthana12@gmail.com` with verified email) or users with `role == 'admin'` in `/users/{uid}` have full organization-wide operational access.
3. **No Privilege Escalation**: Regular users registering `/users/{uid}` may only create profiles with `role == 'staff'` and cannot modify their own `role`. Only admins can promote/demote roles.
4. **Strict Schema & No Shadow Fields**: Every collection uses a dedicated `isValid[Entity](data)` helper enforcing `hasAll(...)`, `hasOnly(...)`, strict field types, enum membership, string `.size()` bounds, and list `.size()` bounds.
5. **Path Variable Hardening**: Single-document operations (`get`, `create`, `update`, `delete`) validate document IDs via `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
6. **Temporal Integrity & Immutability**: `createdAt` must equal `request.time` on create and remain immutable on update; `updatedAt` must equal `request.time` on both create and update; `ownerId` is immutable after creation.
7. **Terminal State Protection**: Paid/settled documents (`status == 'จ่ายแล้ว'` or `status == 'Paid'` or `status == 'รับเงินแล้ว'`) cannot be mutated by non-admin users once finalized (admins retain correction override).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Read `/customers/CUST-001` with `auth == null`.
2. **Unverified Email Admin Spoof**: Read `/customers/CUST-001` with `email: 'artkitthana12@gmail.com'` and `email_verified: false`.
3. **Self-Assigned Admin Role**: Create `/users/attackerUid` with `role: 'admin'` as a non-admin user.
4. **Role Escalation Update**: Update `/users/staffUid` changing `role` from `'staff'` to `'admin'` as `'staffUid'`.
5. **Cross-Tenant PII Leak (`get`)**: User B attempts `get` on User A's `/customers/CUST-001` (contains phone/address/taxId).
6. **Unfiltered Collection Scrape (`list`)**: User B attempts `list` on `/employees` without `where('ownerId', '==', 'userB')`.
7. **Shadow Field Injection**: Create `/customers/CUST-002` with extra ghost field `isVerified: true`.
8. **ID Poisoning**: Create `/customers/bad..id$$$withSpaces` violating `isValidId`.
9. **Resource Exhaustion (Oversized String)**: Create `/customers/CUST-003` with `address` of 5,000 characters (> 500 maxLength).
10. **Owner Spoofing**: User A creates `/invoices/INV-001` with `ownerId: 'userB'`.
11. **Timestamp Forgery**: Create `/daily_expenses/EXP-001` with backdated `createdAt` instead of `request.time`.
12. **Terminal State Tampering**: Non-admin updates an already paid invoice (`status == 'จ่ายแล้ว'`) to alter `grandTotal`.
