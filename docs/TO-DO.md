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

authentication

A Note on the Renamed File (server_new.ts):
As discussed, the underlying cause of the caching issue for the original utils/supabase/server.ts filename remains a bit of a mystery (likely a Next.js dev server internal). For now, sticking with server_new.ts is the safest bet as it's working.
If, in the future (perhaps after a Next.js version upgrade or if you're doing a major cleanup), you want to try renaming it back to server.ts, you can. But be prepared to test thoroughly and potentially revert if the old caching issue resurfaces.
To recap the key fixes:
The persistent runtime error with cookies() was resolved by renaming utils/supabase/server.ts to utils/supabase/server_new.ts and ensuring it correctly uses await cookies().
The TypeScript error for the signOut action in the form was fixed with a type assertion: action={signOut as (formData: FormData) => void}.
The ESLint no-unused-vars error for the cookies import was fixed by removing the unused import.
The leftover comment was manually removed by you.

---

local development to a hosted production environment (like Vercel) relatively straightforward, but there are key areas and configurations you'll need to pay attention to.
In Summary, Bruv:
The transition is mostly about configuration, not rewriting your app. The main steps are:
Set environment variables in Vercel.
Update Supabase URL configurations (Site URL, Redirect URLs) to use your production domain.
Configure your custom domain in Vercel and your DNS provider.
Your Next.js and Supabase code is largely built to adapt, provided these configurations are correct. It's always a good idea to deploy to a Vercel preview environment first, connect it to your Supabase project (perhaps a staging Supabase project if you have one, or your production one with careful testing), and thoroughly test all authentication flows and functionalities using the preview URL before going live with your custom domain.

what our users say on the main apge to be palced back.

charlie
the authentication features are now merged into the main branch and ready for their review. They can pull the latest main to see the changes.

Other on allergies - it might be a random allergy that we dont know about.

maybe implement a reward point system for leaving reviews etc and if you geet certain highamount of points you get money off.
