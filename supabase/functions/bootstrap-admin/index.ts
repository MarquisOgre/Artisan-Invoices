import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Bootstrap / seed admin users.
 *
 * Modes:
 *  - First-run bootstrap: if NO admin exists in user_roles yet, the caller
 *    may create/promote an admin without being authenticated. This is how the
 *    very first admin is seeded.
 *  - Ongoing seeding: once at least one admin exists, the caller MUST be
 *    authenticated AND have the admin role.
 *
 * Behavior:
 *  - If the target email already exists as an auth user, ensure they have the
 *    admin role (idempotent). Password is only set if provided AND the caller
 *    is authorized to (bootstrap mode or admin).
 *  - If the target email does not exist, create the user with the provided
 *    password (email auto-confirmed) and assign the admin role.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json().catch(() => ({}))
    const email: string | undefined = body?.email
    const password: string | undefined = body?.password

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check whether any admin exists.
    const { count: adminCount, error: countError } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if (countError) {
      return new Response(
        JSON.stringify({ error: countError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isBootstrap = (adminCount ?? 0) === 0

    // If not bootstrap, require an authenticated admin caller.
    if (!isBootstrap) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !caller) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { data: callerRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', caller.id)
        .single()
      if (callerRole?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Only admins can seed additional admins' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Password validation when creating a user or when explicitly resetting.
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Password must be between 8 and 100 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Look up user by email.
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const existing = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string
    let createdUser = false

    if (existing) {
      userId = existing.id
      // Optionally reset password if provided.
      if (password) {
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
        if (updErr) {
          return new Response(
            JSON.stringify({ error: updErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } else {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password is required to create a new admin user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createErr || !created.user) {
        return new Response(
          JSON.stringify({ error: createErr?.message ?? 'Failed to create user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = created.user.id
      createdUser = true
    }

    // Ensure admin role assignment (idempotent).
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!existingRole) {
      const { error: insErr } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' })
      if (insErr) {
        return new Response(
          JSON.stringify({ error: insErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (existingRole.role !== 'admin') {
      const { error: updErr } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId)
      if (updErr) {
        return new Response(
          JSON.stringify({ error: updErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bootstrap: isBootstrap,
        created: createdUser,
        user: { id: userId, email, role: 'admin' },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('bootstrap-admin error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
