import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

// TEMP one-shot seed. Deletes itself semantically after use — will be removed.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const password = 'qwerty@1234567890'
  const targets = ['admin@gmail.com', 'vbhupeshkumar@gmail.com']
  const results: any[] = []
  const { data: list } = await admin.auth.admin.listUsers()
  for (const email of targets) {
    const existing = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    let userId: string
    if (existing) {
      userId = existing.id
      const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
      if (error) { results.push({ email, error: error.message }); continue }
    } else {
      const { data: c, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error || !c.user) { results.push({ email, error: error?.message ?? 'create failed' }); continue }
      userId = c.user.id
    }
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', userId).maybeSingle()
    if (!role) await admin.from('user_roles').insert({ user_id: userId, role: 'admin' })
    else if (role.role !== 'admin') await admin.from('user_roles').update({ role: 'admin' }).eq('user_id', userId)
    results.push({ email, userId, ok: true })
  }
  return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
