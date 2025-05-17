Crucially, you need to go to your Supabase project settings (Authentication -> URL Configuration) and add yourdomain.com/reset-password (or http://localhost:3000/reset-password for local development) to the "Redirect URLs" allow list. If you don't do this, Supabase will block the redirect. (I HAVE ADDED IT AS LOCAL HOST SO FAR BUT NEED TO CHANGE IT WHEN I ADD MY DOMAIN)
It provides a generic success message ("If an account exists...") for security reasons, so it doesn't confirm whether an email is registered or not.

Email Template: You might want to customize the password reset email template in your Supabase project settings (Authentication -> Email Templates) to match your app's branding.

---
