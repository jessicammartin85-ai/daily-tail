# Firebase account foundation (development branch)

## Status
This is an **isolated account connection lab**, not a cloud migration or production release.

- Existing `index.html` is unchanged.
- Existing local usernames/PINs are unchanged.
- Existing dog profiles, notes, schedules, posts, photos, and invitation records are untouched.
- No production data is automatically uploaded.
- Test users created here **are real Firebase Authentication users** in the existing `daily-tail` Firebase project.
- The Firestore smoke test temporarily writes only to `users/{signedInUid}/cloudSetupChecks/accountConnectionLab` then reads and deletes it. A failed test may leave this test document.

## Files
- `firebase-account-lab.html`: independent manual test of Firebase Auth (email/password, Google popup, password reset) and private Firestore read/write/delete.
- `index.html`: not changed, by design.

## Test prerequisites
1. Confirm that the existing local Daily Tail backup has been downloaded and stored privately.
2. Firebase Console → Authentication → Sign-in method: Email/Password and Google enabled.
3. Firebase Console → Authentication → Settings → Authorized domains: include the actual test site's hostname.
4. Firestore production rules must authorize the signed-in owner to read/write their own `/users/{uid}` private subtree, as the currently reviewed rules do.
5. Serve the HTML over a trusted HTTPS origin or localhost. **GitHub Pages normally serves the default/publishing branch, not this development branch**. To test this branch without changing the live site, use a separate preview deployment/origin and authorize that hostname in Firebase if needed. Do not simply merge for testing.

## Manual checks
- Open only the lab page on the preview site.
- Create or sign in with a **test account** (not the existing Daily Tail PIN).
- Confirm the identity is shown and the app signs out and back in properly.
- Run the private database test; expect `Success: private record created, read, and deleted.`
- In the Firebase Console, confirm the test user exists. If a test fails, inspect `users/{uid}/cloudSetupChecks/accountConnectionLab` and remove any leftover test record.
- Confirm the normal live site still opens and Lou's existing data remains present.

## Security and privacy decisions before real sync
- Do **not** copy local account PIN hashes, local invite codes, backups, emergency contacts, or full browser storage into shared profiles.
- Use Firebase UID and server-enforced membership rules; never rely on hiding UI as authorization.
- Verify the full active Firestore ruleset in the Emulator before updating the live rules. Pay particular attention to paths, member roles, public links, data types, and permitted update fields.
- Back up local data, then implement **explicit opt-in migration** with preview, duplicate detection, validation, and rollback.
- Treat photos separately; Cloud Storage may need a billing-plan decision.
- Current `users/{uid}` rules give owners private access. Do not use this test to suggest family sync is implemented.

## Next coding milestone
Introduce a feature-flagged authentication adapter in the main UI on the development branch, retaining local login as the default. Follow with a separate cloud data adapter and a test dog. Do not replace existing local data or publish to main until verified.
