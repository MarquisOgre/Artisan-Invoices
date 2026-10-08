import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username, password } = await req.json()
    const normalizedUsername = String(username || '').trim().toLowerCase()

    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername) || !password) {
      return new Response(
        JSON.stringify({ error: 'Invalid login credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: loginName, error: lookupError } = await supabaseAdmin
      .from('user_login_names')
      .select('user_id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (lookupError || !loginName) {
      return new Response(
        JSON.stringify({ error: 'Invalid login credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(loginName.user_id)

    if (userError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid login credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: userData.user.email,
      password,
    })

    if (authError || !authData.session) {
      return new Response(
        JSON.stringify({ error: 'Invalid login credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Username login error:', error)
    return new Response(
      JSON.stringify({ error: 'Invalid login credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
