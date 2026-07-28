import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Bootstrap / seed admin users.
 *
 * Modes:
 *  - First-run bootstrap: if NO admin exists in user_roles yet, the caller may
 *    create/promote an admin without being authenticated.
 *  - Ongoing seeding: once at least one admin exists, the caller MUST be
 *    authenticated AND have the admin role.
 *
 * Writes an entry to public.audit_log on every successful run.
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

    let actorId: string | null = null
    let actorEmail: string | null = null

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
      actorId = caller.id
      actorEmail = caller.email ?? null
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Password must be between 8 and 100 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

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
    let passwordUpdated = false

    if (existing) {
      userId = existing.id
      if (password) {
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
        if (updErr) {
          return new Response(
            JSON.stringify({ error: updErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        passwordUpdated = true
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

    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    let rolePromoted = false
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
      rolePromoted = true
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
      rolePromoted = true
    }

    // Audit log entry (best-effort; do not block response on log errors)
    await supabaseAdmin.from('audit_log').insert({
      event_type: 'bootstrap_admin',
      target_email: email,
      target_user_id: userId,
      actor_user_id: actorId,
      actor_email: actorEmail,
      details: {
        bootstrap: isBootstrap,
        created: createdUser,
        password_updated: passwordUpdated,
        role_promoted: rolePromoted,
      },
    })

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
