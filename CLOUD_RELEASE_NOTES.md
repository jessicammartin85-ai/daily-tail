# Daily Tail cloud-first release candidate

## What this branch actually does
The **default `index.html`** on this branch is a new cloud-first application powered by Firebase Authentication and Firestore. It supports:
- Google sign-in and email/password accounts
- Multiple private dogs per Firebase account
- Editable names, breed, birthday, personality and favorite saying
- Daily Plan tasks and per-day completion
- Private text-only Recent Posts
- Live Firestore listeners for cross-device updates
- Basic revision checks for profile edits to avoid silent concurrent overwrites
- Archiving and restoring a dog without permanent deletion

The original complete browser-based Daily Tail application is copied unchanged (except an optional link to the cloud edition already on the branch) at **`legacy.html`**. Because local storage is origin-based rather than HTML-filename-based, opening `legacy.html` from the same GitHub Pages origin should retain the same browser storage *if it was not cleared*. However, data preservation must be verified in a real browser before deployment.

## What is NOT ready
- This release candidate is **not** the polished existing Daily Tail UI; it is a simplified new interface using the existing collar logo. Do **not** merge as a drop-in replacement if preserving the existing visual interface and all menus is required.
- Existing photos, media uploads, owner/child/friend access, comments, invitations, caregiver controls, emergency information, training, schedule editing parity, and other existing features are **not migrated or fully reimplemented**.
- Existing browser data is **not** automatically synchronized or imported. Lou's old information stays only in the legacy app unless entered into the cloud app.
- There is no family shared role access. Only the owner's authenticated Firebase UID can access private cloud records.
- Firestore Rules should be validated against the actual live ruleset and tested with the emulator, including negative cross-account tests.
- Simultaneous activity edits rely on Firestore last-write-wins. Full conflict audit is not implemented.
- This has not been browser-tested or deployed. JavaScript syntax validation and static inspection do not prove full functionality.

## Paths and authorization
Private cloud records are stored in:
- `users/{uid}/dogs/{dogId}`
- `users/{uid}/dogs/{dogId}/activities/{activityId}`
- `users/{uid}/dogs/{dogId}/posts/{postId}`

Existing Firestore rules in this repository permit the signed-in owner to read/write their own subtree. Existing publicly readable and friend-sharing collections are not used by the new cloud-first app.

## Preview safely (not live)
1. Select the `release/cloud-first-v1` branch in GitHub, Download ZIP, Extract All.
2. Open Command Prompt in the folder containing `firebase-cloud-preview.json`.
3. Run only:
   ```cmd
   npx --yes firebase-tools hosting:channel:deploy cloud-release --config firebase-cloud-preview.json --project daily-tail --expires 7d
   ```
4. Use the **actual** Channel URL shown by Firebase. Never guess.
5. If Google authentication reports unauthorized domain, add only this preview hostname in Firebase Authentication → Settings → Authorized domains.
6. Use a separate non-sensitive test dog. Test sign-in, create, profile edits, two daily tasks, check-off, text post, refresh, second-device reading, and sign-out.
7. Verify `legacy.html` on this same preview origin, but remember browser-local data is origin-specific, so this preview cannot automatically see local content from GitHub Pages.
8. Inspect that no other UID can read the test dog's private Firestore records using a second account and Rules Emulator.
9. Do NOT merge this branch while missing features are needed, and do not deploy via `firebase deploy` (which targets the live Firebase Hosting channel).

## Release checklist
- [ ] Confirm feature parity with existing Daily Tail user experience or explicitly approve a simplified replacement.
- [ ] Confirm live GitHub Pages `legacy.html` reads original local data on the same browser.
- [ ] Test Firebase sign-in, create, edit, archive, daily plan completion, posts, and account isolation.
- [ ] Test Android mobile layout and cross-device data consistency.
- [ ] Document rollback to prior `main` commit and retain unmodified source.
- [ ] Approve merge to `main` only after checks pass.

The live GitHub Pages site remains unchanged until an intentional merge to `main`.
