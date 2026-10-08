import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { username, email, password, role } = await req.json()

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Username, email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedUsername = String(username || '').trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      return new Response(
        JSON.stringify({ error: 'Username must be 3-30 characters and contain only letters, numbers, dot, dash or underscore.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingUsername, error: usernameLookupError } = await supabaseAdmin
      .from('user_login_names')
      .select('user_id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (usernameLookupError) {
      console.error('Username lookup failed:', usernameLookupError)
      return new Response(
        JSON.stringify({
          error: 'Username login is not configured correctly. Please run the username login database migration.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: 'That username is already in use. Please choose another username.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: normalizedUsername }
    })

    if (createError) {
      console.error('User creation error:', createError)
      
      // Handle duplicate user error specifically
      if (createError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'A user with this email already exists. Please use a different email address.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: usernameInsertError } = await supabaseAdmin
      .from('user_login_names')
      .insert({ user_id: newUser.user.id, username: normalizedUsername })

    if (usernameInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: usernameInsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign role to the new user
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role
      })

    if (roleInsertError) {
      // Do not leave an orphaned auth user + username mapping when role creation fails.
      await supabaseAdmin.from('user_login_names').delete().eq('user_id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)

      return new Response(
        JSON.stringify({ error: roleInsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: newUser.user.id,
          username: normalizedUsername,
          email: newUser.user.email,
          role: role
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
