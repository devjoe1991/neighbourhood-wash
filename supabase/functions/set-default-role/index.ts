// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'npm:@supabase/supabase-js@^2.0.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Set Default Role for Google OAuth Users Edge Function Initialized')

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record: newUser } = await req.json() // Supabase webhook sends the new record

    // Ensure essential fields are present
    if (!newUser || !newUser.id) {
      console.error('New user record or ID is missing:', newUser)
      return new Response(
        JSON.stringify({ error: 'User record or ID missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Determine if the user signed up via Google by checking raw_user_meta_data.iss
    let isGoogleUser = false
    if (
      newUser.raw_user_meta_data &&
      newUser.raw_user_meta_data.iss === 'https://accounts.google.com'
    ) {
      isGoogleUser = true
    }
    // Fallback checks if the primary one fails, though raw_user_meta_data.iss should be reliable for Google.
    if (
      !isGoogleUser &&
      newUser.identities &&
      Array.isArray(newUser.identities)
    ) {
      isGoogleUser = newUser.identities.some((id) => id.provider === 'google')
    }
    if (
      !isGoogleUser &&
      newUser.app_metadata &&
      newUser.app_metadata.provider === 'google'
    ) {
      isGoogleUser = true
    }

    if (isGoogleUser) {
      console.log(
        `Processing new Google OAuth user: ${newUser.id}, email: ${newUser.email}`
      )

      const supabaseAdmin = createClient(
        Deno.env.get('PROJECT_SUPABASE_URL') ?? '',
        Deno.env.get('PROJECT_SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Step 1: Ensure user_metadata field exists (try initializing as empty object)
      const { error: initError } =
        await supabaseAdmin.auth.admin.updateUserById(
          newUser.id,
          { user_metadata: {} } // Try to set it to an empty object first
        )

      if (initError) {
        console.error(
          `Error initializing user_metadata for ${newUser.id}:`,
          initError
        )
        // Potentially return error, or proceed cautiously. For now, log and continue.
      } else {
        console.log(
          `Successfully initialized user_metadata for ${newUser.id} (or it already existed).`
        )
      }

      // Step 2: Now, update with the selected_role
      const { data, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(newUser.id, {
          user_metadata: { selected_role: 'user' },
        })

      if (updateError) {
        console.error(
          `Error setting selected_role for Google OAuth user ${newUser.id} metadata:`,
          updateError
        )
        return new Response(JSON.stringify({ error: updateError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }

      console.log(
        `Successfully set 'selected_role: user' for Google OAuth user ${newUser.id}`,
        data
      )
      return new Response(
        JSON.stringify({
          message: `User ${newUser.id} (Google OAuth) metadata updated.`,
          user: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log(
        `User ${newUser.id} (email: ${newUser.email}, raw_user_meta_data_iss: ${newUser.raw_user_meta_data?.iss}, app_provider: ${newUser.app_metadata?.provider}) is not a Google OAuth user. Skipping role update.`
      )
      return new Response(
        JSON.stringify({
          message: 'Not a Google OAuth user. Role not set by this function.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // It's not an error, just a skipped operation
        }
      )
    }
  } catch (err) {
    console.error('Error in Edge Function:', err.message, err.stack)
    return new Response(
      JSON.stringify({ error: `Function error: ${err.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-default-role' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
