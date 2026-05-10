# Security Specification for DailyMate

## Data Invariants
- Each document must belong to a signed-in user (`ownerId` or `userId` or document ID for users).
- Users can only read and write their own data.
- Timestamps like `lastWatered`, `lastServiceDate`, or `date` must be validated.
- Field types must be strictly enforced.

## The Dirty Dozen Payloads (Rejection Targets)

1. **Identity Spoofing**: Attempt to create a vehicle with an `ownerId` that is not my own.
2. **PII Leak**: Attempt to read another user's profile document.
3. **Ghost Field**: Attempt to add `isAdmin: true` to a user document.
4. **Invalid Type**: Attempt to set `odometer` to a string instead of a number.
5. **Resource Poisoning**: Attempt to set `name` to a 2MB string.
6. **State Shortcutting**: Attempt to update `lastServiceDate` without providing `odometer` if the rule requires it.
7. **Size Violation**: Attempt to add 1000 items to a list that should have max 10.
8. **Unauthorized Query**: Attempt to list all vehicles in the collection without a `where` clause on `ownerId`.
9. **ID Injection**: Attempt to create a document with a junk string ID (e.g., "!!!!").
10. **Immutable Field Write**: Attempt to change `uid` on a user profile after creation.
11. **Future Timestamp**: Attempt to set `lastServiceDate` in the future.
12. **Orphaned Record**: Attempt to create a health log for a user that doesn't exist.

## The Test Runner (Plan)
A `firestore.rules.test.ts` will be implemented to verify these rejections.
