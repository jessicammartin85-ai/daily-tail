# Daily Tales cloud accounts: activation and safety checks

The GitHub Pages app now uses the original interface with Firebase Google/email sign-in and per-dog Firestore records. The browser holds a compatibility cache; the cloud is the record used for multi-device synchronization.

## 1. Activate updated Firestore rules
The rules tracked here are **not** automatically installed in Firebase by a GitHub Pages deployment.

1. Sign in at https://console.firebase.google.com/ and open the **daily-tail** project.
2. Go to **Firestore Database → Rules**.
3. Open the repository's **firestore.rules** file, copy the entire file, and paste it into the Firebase Rules editor.
4. Choose **Publish**. Verify successful publication before inviting adults or children.

The repository also includes firebase.json and .firebaserc, so an authenticated Firebase CLI can run:
```
firebase deploy --only firestore:rules
```

## 2. Google authentication
In Firebase **Authentication → Sign-in method**, enable Google and Email/Password as desired. Under **Authentication → Settings → Authorized domains**, include `jessicammartin85-ai.github.io`. If Google popups fail on a phone, check Chrome's tab and popup settings.

## 3. Preserve and link Lou's existing browser profile
On the ORIGINAL phone containing Lou's photos, schedule and notes:
1. Open the existing Daily Tales URL.
2. Sign in with Google or email. Confirm the correct account address.
3. When **Connect your dogs** appears, choose **Save my dogs to this account**.
4. For the one-time safety check, you may need to choose **Unlock original owner profile** to enter the old local PIN. Then choose **Finish cloud account linking**.
5. Do not create a duplicate Lou profile, erase browser data, or choose to replace your local dog with a different cloud copy.

The old browser data remains available for recovery.

## 4. Check on a second device
Sign in with the SAME Firebase account on a device without existing Daily Tales local profiles. Verify Lou's photo, breed, posts, training, schedule, and notes. Mark a schedule item complete and verify the change arrives on the other device while both are open.

## 5. Sharing
- Friend View links/codes access only opted-in public fields and do not require a login.
- Adult and Child invitation codes require signing in and owner approval.
- Adult membership allows cloud profile editing. Child photos/posts are proposed for adult approval.
- Rules publication is required for the new membership permissions.

## Limitations and precautions
- This release passes source-level syntax checks, but end-to-end Firebase Auth, rules, and two-device testing require a signed-in project and devices.
- If two devices edit the same dog at once, saving pauses rather than silently discarding a version.
- Large embedded photos may require resizing to fit Firestore transaction limits.
- The old cloud.html prototype is retained for recovery/reference; it is not the intended primary app.
- The first local profile migration is deliberately opt-in; a different Google account cannot silently claim the phone's old dog profiles.
