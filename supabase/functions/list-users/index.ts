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
          persistSession: false,
        },
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

    // Ensure requester is admin
    const { data: requesterRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || requesterRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can list users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all roles (service role bypasses RLS)
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, created_at')
      .order('created_at', { ascending: true })

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: rolesError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Username login uses user_login_names as its canonical mapping.
    // Read it as well as Auth metadata so older accounts and accounts created
    // before metadata was populated still display their username in the list.
    const userIds = (roles ?? []).map((r) => r.user_id)
    const usernameByUserId = new Map<string, string>()

    if (userIds.length > 0) {
      const { data: loginNames, error: usernamesError } = await supabaseAdmin
        .from('user_login_names')
        .select('user_id, username')
        .in('user_id', userIds)

      if (usernamesError) {
        console.error('Error fetching username mappings:', usernamesError)
        return new Response(
          JSON.stringify({ error: 'Could not load usernames. Check the user_login_names table and migration.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      for (const row of loginNames ?? []) {
        usernameByUserId.set(row.user_id, row.username)
      }
    }

    // Build users list with email + role. Prefer Auth metadata for the original
    // display casing, and fall back to the canonical username-login mapping.
    const users: Array<{ id: string; username: string; email: string; role: string; created_at: string }> = []
    for (const r of roles ?? []) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(r.user_id)
      if (!userError && userData?.user) {
        const metadataUsername = String((userData.user.user_metadata as Record<string, unknown> | null)?.username ?? '').trim()
        const mappedUsername = usernameByUserId.get(userData.user.id) ?? ''
        users.push({
          id: userData.user.id,
          username: metadataUsername || mappedUsername,
          email: userData.user.email ?? 'Unknown',
          role: r.role as string,
          created_at: r.created_at as string,
        })
      }
    }

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error listing users:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
