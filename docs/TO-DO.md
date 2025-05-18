Crucially, you need to go to your Supabase project settings (Authentication -> URL Configuration) and add yourdomain.com/reset-password (or http://localhost:3000/reset-password for local development) to the "Redirect URLs" allow list. If you don't do this, Supabase will block the redirect. (I HAVE ADDED IT AS LOCAL HOST SO FAR BUT NEED TO CHANGE IT WHEN I ADD MY DOMAIN)
It provides a generic success message ("If an account exists...") for security reasons, so it doesn't confirm whether an email is registered or not.

Email Template: You might want to customize the password reset email template in your Supabase project settings (Authentication -> Email Templates) to match your app's branding.

---

google Oauth
Go to https://console.cloud.google.com/.
Add your domain (e.g., localhost:3000 for local testing, and your production domain later) to "Authorized domains".
TO NOTE...
google oauth comment
Okay Bruv, I've made the changes to app/signup/page.tsx and app/signin/page.tsx to comment out the Google OAuth buttons and their respective handler functions (handleGoogleSignUp and handleGoogleSignIn).
I've opted to comment them out rather than completely delete the code. This way, if you decide to re-enable Google OAuth in the future, it will be easier to uncomment the relevant sections. I also commented out the "Or continue with" dividers.

Edge Function Consideration: As mentioned, the set-default-role Edge Function has logic for Google users. This logic will now be dormant. You can leave it as is, or we can look at simplifying it later if you decide Google OAuth is permanently removed.
Unused Imports: I didn't automatically remove imports like Icons from @/components/icons because I couldn't be certain if Icons.spinner or other icons were used elsewhere in those files. If Icons.google was the only icon used from that import and it's now commented out, you might want to manually remove or adjust the import statement to keep your code clean.

---
