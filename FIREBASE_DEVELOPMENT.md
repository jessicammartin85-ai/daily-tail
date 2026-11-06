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

## Deploy an isolated preview (Windows, one-time manual procedure)

The development branch now includes `firebase-preview/index.html` and `firebase.json`. The Hosting configuration serves **only** the lab folder, never `index.html` or dog data.

1. From the branch page on GitHub, choose **Code → Download ZIP**, then extract it. Ensure the extracted folder contains `firebase.json` and `firebase-preview`.
2. If Node.js is not installed, install the current LTS version from https://nodejs.org/. In Windows File Explorer, open the extracted project folder, click the address bar, type `cmd`, and press Enter to open Command Prompt in that directory.
3. Run `npx --yes firebase-tools login`, then sign in with the Google account that owns the **daily-tail** Firebase project. Confirm the project with `npx --yes firebase-tools projects:list`.
4. Run **only** this preview command:

   ```shell
   npx --yes firebase-tools hosting:channel:deploy account-lab --project daily-tail --expires 7d
   ```

   Never use `firebase deploy` or `--only hosting` here: those target the live Firebase Hosting channel.
5. Copy the actual preview URL printed by the command. Do not guess it.
6. Email/password can be tested first. For Google sign-in, add the **exact preview hostname** (not URL/path) to Firebase Authentication → Settings → Authorized domains if needed; do not authorize unrelated domains.
7. Use a disposable test account. Run the private database smoke test and verify success.
8. When the preview expires, its link stops working; re-deploy only with the preview command when testing further.

**Notes:** Firebase Hosting preview URLs are publicly accessible to anyone with the URL. The lab only contains the Firebase public web config and test UI, not Lou's data. However, the lab connects to the same real Firebase Authentication and Firestore project. Never test with real private dog data. If Firebase Hosting hasn't been activated in the Firebase Console, visit Build → Hosting and complete Get started without deploying to live.

Official guidance: https://firebase.google.com/docs/hosting/test-preview-deploy and https://firebase.google.com/docs/cli.

## November 5: isolated cloud test dog added
- The account lab and `firebase-preview/index.html` now include a fictional test dog form.
- Location: `users/{authenticatedUid}/testDogs/connection-lab-dog`.
- Operations: save, real-time read, explicit reload, and confirmation-based delete.
- Data stored: test name, test note, marker `type: development-test-only`, server update timestamp.
- No existing dog data is read or migrated; no production `index.html` modifications.
- Current active Firestore rules must allow the authenticated user access to their own private descendants under `users/{uid}`.
- Repeat preview deploy after downloading the latest development branch ZIP. Deploy only `hosting:channel:deploy account-lab`. Test on two signed-in browsers, then delete the fictional test record.
- This is **not yet** an integration into the main Daily Tail interface; next milestone is a feature-flagged cloud profile adapter and reviewed data migration.

## My Dogs development-preview integration

The **real `index.html`** on the development branch now loads `my-dogs-cloud-dev.js`, which adds a labelled Cloud Test Dogs panel to the My Dogs entry screen (and the first-run gate), and a clearly marked Firebase-only test dog tile within the My Dogs list when applicable. The existing local dog picker remains intact.

**This is a limited test bridge, not production sync.** It reads and writes only:
`users/{firebaseAuthUid}/testDogs/connection-lab-dog` (the previously tested fictional dog).
It uses Google or email Firebase sign-in. Local PIN, access codes, photos, schedules, post data and any preexisting dog are not uploaded or changed. The old `cloud-sync.js` whole-browser snapshot module is disabled **on this development branch only**.

### Deploy the full development app to a NEW temporary preview channel

1. From GitHub select `development/firebase-accounts-foundation`, use **Code → Download ZIP**, then **Extract All**. In File Explorer open the extracted project folder that contains both `index.html` and `firebase-app-preview.json`. The command prompt path **must not contain `.zip`**.
2. Use the verified Firebase CLI sign-in on Windows.
3. Copy this exact command (one line):

   ```cmd
   npx --yes firebase-tools hosting:channel:deploy my-dogs-dev --config firebase-app-preview.json --project daily-tail --expires 7d
   ```

   **Do not** run `firebase deploy`, `firebase deploy --only hosting`, or the old `account-lab` deployment command for this phase. The alternate config deliberately serves the full development app, while `firebase.json` still serves only the earlier lab.
4. Open the **actual preview URL printed by Firebase**, not a guessed URL. The full app should show its local sign-in plus a **Cloud Test Dogs** section. Signing in to Firebase here does not sign in to the local PIN-based app.
5. If Google sign-in gives `auth/unauthorized-domain`, add only the exact new preview **hostname** under Firebase Authentication → Settings → Authorized domains.
6. Use the same Google account as the successful test lab. The fictional Test Puppy should load. If you separately sign into the local My Dogs picker, the clearly marked cloud test tile will also appear among the local cards.
7. Compare the test dog name/note here with those in the original account-lab link. Edit the fictional dog's note on one page and check that it changes on the other. Delete the test record only when testing is done.
8. **No real migration** until emulator rule tests, explicit backup verification, a conflict strategy, and a separate opt-in migration flow are ready.

### Important limitations
- This preview shares **real Firebase Authentication and Firestore** with the current project. Use fictional dog data.
- The preview URL is not private access control: the preview website can be opened by anyone with its URL. Firebase Security Rules protect the private test data.
- The dev bridge does not grant cross-account family access and does not replace local user identities.
- The original GitHub Pages Daily Tail site and `main` branch are unchanged.

## Multiple Cloud Test Dogs (development only)
- On the development My Dogs gate, a Firebase-authenticated person can create, select, edit, and delete multiple **fictional** dogs.
- Private Firestore collection: `users/{uid}/cloudTestDogs/{autoGeneratedId}`.
- A document includes `name`, `note`, `type:'development-test-only'`, and Firestore timestamps. The UI limits entries to 20 fictional test dogs.
- Only records explicitly marked `development-test-only` are rendered. The earlier `users/{uid}/testDogs/connection-lab-dog` stays untouched; an optional **Copy as another cloud test dog** action imports its fictional name/note without deleting or rewriting the original.
- Cloud entries appear in a separately labelled, dashed tile in the real My Dogs picker, and editing them changes only private Firestore documents. Clicking one selects the cloud test record for editing; it does **not** open a local dog profile.
- Local PINs, photos, schedules, memories, family sharing, and private backups remain unchanged and are **not** uploaded by this module.

### Redeploy the multi-dog preview
Download a fresh ZIP of `development/firebase-accounts-foundation`, extract it, open Command Prompt inside the folder containing `firebase-app-preview.json` and run:

```cmd
npx --yes firebase-tools hosting:channel:deploy my-dogs-dev --config firebase-app-preview.json --project daily-tail --expires 7d
```

Use the exact returned **Channel URL**. Continue using the same authorized Firebase account. Add two fictional dogs, select and edit one, reload, then open the preview in a second browser with the same account to confirm the change. Delete the fictional test dogs after the test if desired.

Do not merge into `main` or migrate Lou until a separate, verified data migration and membership design exists.

## Combined development milestone: profiles + Daily Plan + read-only migration inventory

The existing cloud dog test list now integrates with `cloud-profile-plan-dev.js` in the **development branch only**.

- Select Buddy, Daisy, or another **fictional** cloud dog from the `Cloud My Dogs` list. Under the list, edit **breed, birthday, and personality** in that dog's private Firestore document.
- Add time-based plan activities individually under `users/{uid}/cloudTestDogs/{dogId}/plan/{activityId}`, mark each completed/uncompleted, and remove activities. Up to 30 test activities per fictional dog.
- Deleting one fictional cloud dog also deletes its test activity documents.
- Click **Preview existing local data (no upload)** to see a local-only inventory of the browser's `daily_tail_roles_v2` dogs and their stored posts, if any. It is not a full migration mapping: schedules and images still require inspection. The inventory is never sent to Firestore.
- **No local backups, PIN hashes, invitation codes, real dog profiles, schedule entries, photos, or memories are uploaded or migrated.**
- This version does not include real-time family cross-account permissions, photo uploads, conflict resolution for simultaneous edits, or a migration execution button. Those are separate safety milestones.
- The main GitHub Pages site remains unchanged.

### Deploy the combined development preview

Download a fresh ZIP of the `development/firebase-accounts-foundation` branch, extract it, and open Command Prompt in the directory containing `firebase-app-preview.json`.

```cmd
npx --yes firebase-tools hosting:channel:deploy my-dogs-dev --config firebase-app-preview.json --project daily-tail --expires 7d
```

Use the **Channel URL returned by Firebase**. The test scenario: select Buddy, save breed/birthday/personality, add two Daily Plan activities, check one off, refresh, and verify the profile and activities persist. Select Daisy and confirm Buddy's activities do not appear there. Return to Buddy and verify separation. Optionally sign into the same Firebase account on another device to verify the same data.

## Safe first real-profile staging (opt-in; not a migration of the live app)

The **development My Dogs preview only** now includes a **Private profile migration preview** panel that accepts an existing `Daily_Tail_Private_Backup_YYYY-MM-DD.json` created from an Adult Owner account in the live app.

The file is parsed **locally**, not automatically uploaded. It inventories dog profiles and lets the account owner review/edit four fields: **name, breed, birthday, personality**. Pictures, memories, schedules, invitations, users, PIN hashes and all other stored data are explicitly excluded from upload. This prototype cannot restore a dog profile or synchronize it into the working live app.

When a user selects a dog, checks the backup/approval checkbox and confirms the dialog, the development module creates **one private staging document** at `users/{authenticatedUid}/stagedDogs/{hashedOriginalId}`, with `type: private-staged-profile-v1`, `shared: false`, `status: staged`, and the four reviewed fields. This is **write-once per source dog**: any existing destination prevents a second import instead of overwriting. The ID is derived from a SHA-256 digest of Firebase UID + local dog ID, not from an uploaded local access code.

The existing Firestore owner-only `/users/{uid}/{privateDocument=**}` rule must be independently checked before any real personal information is staged. Do not add member permissions to `stagedDogs`.

### First test
1. Download and securely retain a fresh *complete private* backup from your **live** Daily Tail before using this preview.
2. Download the latest development branch ZIP and redeploy **only** the `my-dogs-dev` Firebase preview channel with `firebase-app-preview.json`:
   ```cmd
   npx --yes firebase-tools hosting:channel:deploy my-dogs-dev --config firebase-app-preview.json --project daily-tail --expires 7d
   ```
3. Open the newly deployed preview, sign into Firebase, and inspect **Private profile migration preview**.
4. For a no-write test, select your local backup file and review the parsed dog names and four fields; stop here. The backup must remain private, and there should be no new `stagedDogs` record.
5. **Do not click Stage this dog profile in cloud until you deliberately choose to test saving those limited fields**. This is not needed to verify that the preview works.
6. After review, verify the live Daily Tail profile still works and that your offline backup remains available.

### Still required before switching to real cloud accounts
- Independent review and emulator testing of the complete Firestore rules.
- Readable verification of the uploaded staging record, including deletion/reversal procedure.
- Structured schedule and memory mapping, secure photo storage, data-size checks and audit trail.
- Explicit migration and merge resolution for cross-device edits.
- Family member access checks and isolation of private vs public data.
