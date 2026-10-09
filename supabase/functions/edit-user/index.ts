import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Missing authorization header' }, 401)

    const { data: { user: requester }, error: authError } =
      await supabaseAdmin.auth.getUser(authHeader.slice(7))
    if (authError || !requester) return json({ error: 'Unauthorized' }, 401)

    const { data: requesterRole, error: requesterRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requester.id)
      .maybeSingle()

    if (requesterRoleError || requesterRole?.role !== 'admin') {
      return json({ error: 'Only admins can edit users' }, 403)
    }

    const body = await req.json()
    const userId = String(body.userId ?? '').trim()
    // Keep the administrator's chosen display casing, while normalizing the
    // canonical login mapping so username-based sign-in remains case-insensitive.
    const displayUsername = String(body.username ?? '').trim()
    const normalizedUsername = displayUsername.toLowerCase()
    const email = String(body.email ?? '').trim().toLowerCase()
    const role = body.role

    if (!userId || !email || !USERNAME_PATTERN.test(normalizedUsername)) {
      return json({
        error: 'A valid user ID, email, and username (3–30 characters: letters, numbers, dot, dash, underscore) are required.',
      }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Enter a valid email address.' }, 400)
    }
    if (role !== 'admin' && role !== 'user') {
      return json({ error: 'Role must be admin or user.' }, 400)
    }

    // Avoid accidentally removing the last administrator.
    if (userId === requester.id && role !== 'admin') {
      return json({ error: 'You cannot remove your own admin role.' }, 400)
    }

    const { data: targetRole, error: targetRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    if (targetRoleError || !targetRole) return json({ error: 'User not found.' }, 404)

    // Prevent an edit from removing the final administrator account.
    if (targetRole.role === 'admin' && role === 'user') {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (adminCountError) {
        console.error('Could not verify administrator count:', adminCountError)
        return json({ error: 'Could not verify administrator safety. Please try again.' }, 500)
      }

      if ((adminCount ?? 0) <= 1) {
        return json({ error: 'The last administrator cannot be changed to a regular user.' }, 400)
      }
    }

    const { data: existingUsername, error: lookupError } = await supabaseAdmin
      .from('user_login_names')
      .select('user_id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (lookupError) return json({ error: 'Could not validate username uniqueness.' }, 500)
    if (existingUsername && existingUsername.user_id !== userId) {
      return json({ error: 'That username is already in use. Choose another username.' }, 409)
    }

    const { data: targetAuth, error: targetAuthError } =
      await supabaseAdmin.auth.admin.getUserById(userId)
    if (targetAuthError || !targetAuth.user) return json({ error: 'User not found.' }, 404)

    // Update Auth email and username metadata. If the database writes below fail,
    // report the failure clearly rather than claiming that all changes succeeded.
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: {
        ...(targetAuth.user.user_metadata ?? {}),
        username: displayUsername,
      },
    })
    if (authUpdateError) return json({ error: authUpdateError.message }, 400)

    const { error: usernameUpsertError } = await supabaseAdmin
      .from('user_login_names')
      .upsert({ user_id: userId, username: normalizedUsername }, { onConflict: 'user_id' })
    if (usernameUpsertError) {
      console.error('Username mapping update failed:', usernameUpsertError)
      return json({ error: 'Email was updated, but saving the username failed. Please retry the edit.' }, 500)
    }

    const { error: roleUpdateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId)
    if (roleUpdateError) {
      console.error('Role update failed:', roleUpdateError)
      return json({ error: 'Username and email were updated, but saving the role failed. Please retry the edit.' }, 500)
    }

    return json({
      success: true,
      user: { id: userId, username: displayUsername, email, role },
    })
  } catch (error) {
    console.error('Error editing user:', error)
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
