import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'Nicht angemeldet' }, 401)

  const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: auth } } })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return json({ error: 'Ungültige Sitzung' }, 401)

  // Jeder angemeldete Mitarbeiter darf neue Mitarbeiterkonten anlegen.
  // Bestehende Administratorrechte können jedoch nicht von Mitarbeitern verändert werden.
  const { data: callerProfile } = await userClient.from('profiles').select('role,active').eq('id', user.id).maybeSingle()
  const callerRole = callerProfile?.role || user.app_metadata?.role || user.user_metadata?.role || 'mitarbeiter'
  if (callerProfile?.active === false) return json({ error: 'Dein Zugang ist gesperrt.' }, 403)

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const body = await req.json().catch(() => ({}))
  const action = body.action

  if (action === 'create') {
    const { email, password, name = '', role = 'mitarbeiter' } = body
    if (!email || !password || password.length < 6) return json({ error: 'E-Mail und Passwort (mindestens 6 Zeichen) erforderlich.' }, 400)
    const safeRole = callerRole === 'admin' ? role : (role === 'admin' ? 'mitarbeiter' : role)
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role: safeRole, must_change_password: true }, app_metadata: { role: safeRole } })
    if (error) return json({ error: error.message }, 400)
    if (data.user) await admin.from('profiles').upsert({ id: data.user.id, email: data.user.email, name: name || email, role: safeRole, active: true, must_change_password: true }, { onConflict: 'id' })
    return json({ user: data.user })
  }

  if (action === 'update') {
    const { id, email, password, name, role, active } = body
    const current = await admin.auth.admin.getUserById(id)
    if (current.error || !current.data.user) return json({ error: 'Benutzer nicht gefunden.' }, 404)
    const target = current.data.user
    const targetRole = target.app_metadata?.role || target.user_metadata?.role || 'mitarbeiter'
    if (callerRole !== 'admin' && (targetRole === 'admin' || role === 'admin' || role !== undefined || active === false)) return json({ error: 'Diese Änderung ist nur für Administratoren erlaubt.' }, 403)
    if (id === user.id && active === false) return json({ error: 'Du kannst deinen eigenen Zugang nicht sperren.' }, 400)
    const attrs: any = {}
    if (email) attrs.email = email
    if (password) { attrs.password = password; attrs.user_metadata = { ...(target.user_metadata || {}), must_change_password: true } }
    if (name !== undefined || role !== undefined) attrs.user_metadata = { ...(attrs.user_metadata || target.user_metadata || {}), ...(name !== undefined ? { name } : {}), ...(role !== undefined ? { role } : {}) }
    if (role !== undefined) attrs.app_metadata = { ...(target.app_metadata || {}), role }
    if (active === false) attrs.ban_duration = '876000h'
    if (active === true) attrs.ban_duration = 'none'
    const { error } = await admin.auth.admin.updateUserById(id, attrs)
    if (error) return json({ error: error.message }, 400)
    await admin.from('profiles').update({ ...(name !== undefined ? { name } : {}), ...(role !== undefined ? { role } : {}), ...(active !== undefined ? { active } : {}), ...(password ? { must_change_password: true } : {}) }).eq('id', id)
    return json({ ok: true })
  }

  if (action === 'delete') {
    const targetResult = await admin.auth.admin.getUserById(body.id)
    const targetRole = targetResult.data.user?.app_metadata?.role || targetResult.data.user?.user_metadata?.role || 'mitarbeiter'
    if (body.id === user.id) return json({ error: 'Der aktuell angemeldete Benutzer kann nicht gelöscht werden.' }, 400)
    if (callerRole !== 'admin' && targetRole === 'admin') return json({ error: 'Administratoren dürfen nur von Administratoren verwaltet werden.' }, 403)
    if (targetRole === 'admin' && callerRole !== 'admin') return json({ error: 'Nicht erlaubt.' }, 403)
    const { error } = await admin.auth.admin.deleteUser(body.id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) return json({ error: error.message }, 500)
  return json({ users: (data.users || []).map((u: any) => ({ id: u.id, email: u.email, name: u.user_metadata?.name || '', role: u.app_metadata?.role || u.user_metadata?.role || 'mitarbeiter', active: !u.banned_until, must_change_password: !!u.user_metadata?.must_change_password, created_at: u.created_at })) })
})
