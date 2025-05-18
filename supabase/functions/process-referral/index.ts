// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2'

// Note: To properly lint Deno projects with remote imports and Deno globals in VS Code,
// it's recommended to install the Deno VS Code extension and have a deno.jsonc configuration file.
// The linter errors about missing modules or Deno global are likely due to the editor environment
// not being fully Deno-aware. This code is intended for the Supabase Deno runtime.

console.log('Process Referral Edge Function starting up!')

// Define the structure of the incoming request (new user webhook payload)
interface UserRecord {
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: {
    selected_role?: string
    submitted_referral_code?: string // This is what we're interested in
    [key: string]: unknown
  }
  identities?: Array<Record<string, unknown>>
  created_at?: string
  updated_at?: string
}

interface WebhookPayload {
  type: 'INSERT' // We are interested in new user creation
  table: 'users'
  schema: 'auth'
  record: UserRecord
  old_record: null | UserRecord
}

serve(async (req: Request) => {
  console.log('Received request in process-referral function')

  if (req.method !== 'POST') {
    console.log('Invalid request method:', req.method)
    return new Response(
      JSON.stringify({
        error: 'Invalid request method. Only POST is accepted.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 405,
      }
    )
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
    // console.log('Payload received:', JSON.stringify(payload, null, 2)); // Keep this commented unless debugging sensitive data
  } catch (e) {
    const error = e as Error
    console.error('Error parsing request body:', error.message)
    return new Response(
      JSON.stringify({
        error: 'Failed to parse request body',
        details: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Ensure this is an insert event for a new user in auth.users
  if (
    payload.type !== 'INSERT' ||
    payload.schema !== 'auth' ||
    payload.table !== 'users'
  ) {
    console.log(
      'Not a new user event. Skipping. Type:',
      payload.type,
      'Schema:',
      payload.schema,
      'Table:',
      payload.table
    )
    return new Response(
      JSON.stringify({ message: 'Event ignored: not a new user creation.' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200, // Acknowledge but don't process
      }
    )
  }

  const newUser = payload.record
  const submittedReferralCode = newUser.user_metadata?.submitted_referral_code

  if (!newUser || !newUser.id) {
    console.error(
      'New user data or ID is missing in the payload.',
      JSON.stringify(payload.record)
    )
    return new Response(
      JSON.stringify({ error: 'New user data or ID missing.' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  if (!submittedReferralCode) {
    console.log(
      'No submitted referral code for user:',
      newUser.id,
      '. Skipping referral processing.'
    )
    return new Response(
      JSON.stringify({ message: 'No referral code submitted.' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }

  console.log(
    `Processing referral for user ${newUser.id} with code ${submittedReferralCode}`
  )

  try {
    // Deno.env.get will be available in the Supabase Edge Function runtime
    const supabaseURL = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseURL || !supabaseServiceRoleKey) {
      console.error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
      )
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const supabaseAdminClient: SupabaseClient = createClient(
      supabaseURL,
      supabaseServiceRoleKey
    )
    console.log('Supabase admin client initialized.')

    // 1. Validate the submitted_referral_code and find the referrer
    const { data: referrerData, error: referrerError } =
      await supabaseAdminClient
        .from('referrals')
        .select('user_id, code')
        .eq('code', submittedReferralCode.toUpperCase()) // Ensure matching case if codes are stored uppercase
        .single()

    if (referrerError || !referrerData) {
      console.error(
        `Error fetching referrer for code ${submittedReferralCode}:`,
        referrerError ? referrerError.message : 'Referrer not found.'
      )
      // Even if code is invalid, we acknowledge the webhook successfully processed (no retry)
      return new Response(
        JSON.stringify({
          message: `Referral code ${submittedReferralCode} not found or error fetching referrer.`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200, // Or 400 if you want to signal an issue with the code itself
        }
      )
    }

    const referrerUserId = referrerData.user_id
    console.log(
      `Referrer found: user_id ${referrerUserId} for code ${submittedReferralCode}`
    )

    // Prevent self-referral (though a user shouldn't have their own code at signup)
    if (referrerUserId === newUser.id) {
      console.warn(
        `User ${newUser.id} attempted to refer themselves. Skipping.`
      )
      return new Response(
        JSON.stringify({ message: 'Self-referral attempt ignored.' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 2. Create a new entry in the referral_events table
    const { error: insertEventError } = await supabaseAdminClient
      .from('referral_events')
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: newUser.id,
        referral_code_used: submittedReferralCode.toUpperCase(),
        status: 'pending_first_action', // Initial status
      })

    if (insertEventError) {
      // Handle potential unique constraint violation for referred_user_id if this event was somehow processed twice
      if (insertEventError.code === '23505') {
        // unique_violation
        console.warn(
          `Referral event for referred_user_id ${newUser.id} already exists. Skipping. Error:`,
          insertEventError.message
        )
        return new Response(
          JSON.stringify({
            message: 'Referral event already recorded for this user.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200, // Acknowledge as successfully handled (duplicate)
          }
        )
      }
      console.error('Error inserting referral event:', insertEventError.message)
      return new Response(
        JSON.stringify({
          error: 'Failed to insert referral event.',
          details: insertEventError.message,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log(
      `Referral event successfully recorded for referrer ${referrerUserId} and referred user ${newUser.id}`
    )
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Referral processed successfully.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (e) {
    const error = e as Error
    console.error(
      'Unexpected error in Supabase client interaction or main logic:',
      error.message
    )
    return new Response(
      JSON.stringify({
        error: 'An unexpected server error occurred.',
        details: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-referral' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
