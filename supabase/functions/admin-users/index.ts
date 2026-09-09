import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization')
  if (!auth) return new Response(JSON.stringify({error:'Nicht angemeldet'}), {status:401,headers:{'Content-Type':'application/json'}})

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: auth } } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return new Response(JSON.stringify({error:'Ungültige Sitzung'}), {status:401,headers:{'Content-Type':'application/json'}})

  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return new Response(JSON.stringify({error:'Nur Administratoren dürfen Benutzer verwalten.'}), {status:403,headers:{'Content-Type':'application/json'}})

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const body = await req.json().catch(() => ({}))
  const action = body.action

  if (action === 'create') {
    const { email, password, name, role = 'mitarbeiter' } = body
    if (!email || !password || password.length < 6) return new Response(JSON.stringify({error:'E-Mail und Passwort (mindestens 6 Zeichen) erforderlich.'}), {status:400,headers:{'Content-Type':'application/json'}})
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role } })
    if (error) return new Response(JSON.stringify({error:error.message}), {status:400,headers:{'Content-Type':'application/json'}})
    if (data.user) await admin.from('profiles').upsert({id:data.user.id,email:data.user.email,name:name||email,role,active:true},{onConflict:'id'})
    return new Response(JSON.stringify({user:data.user}), {headers:{'Content-Type':'application/json'}})
  }

  if (action === 'update') {
    const { id, email, password, name, role, active } = body
    const attrs:any = {}
    if (email) attrs.email = email
    if (password) attrs.password = password
    if (name !== undefined || role !== undefined) attrs.user_metadata = { ...(await admin.auth.admin.getUserById(id)).data.user?.user_metadata, ...(name !== undefined ? {name}:{}), ...(role !== undefined ? {role}:{}) }
    const { error } = await admin.auth.admin.updateUserById(id, attrs)
    if (error) return new Response(JSON.stringify({error:error.message}), {status:400,headers:{'Content-Type':'application/json'}})
    await admin.from('profiles').update({...(name!==undefined?{name}:{}),...(role!==undefined?{role}:{}),...(active!==undefined?{active}: {})}).eq('id',id)
    return new Response(JSON.stringify({ok:true}), {headers:{'Content-Type':'application/json'}})
  }

  if (action === 'delete') {
    if (body.id === user.id) return new Response(JSON.stringify({error:'Der aktuell angemeldete Administrator kann nicht gelöscht werden.'}), {status:400,headers:{'Content-Type':'application/json'}})
    const { error } = await admin.auth.admin.deleteUser(body.id)
    if (error) return new Response(JSON.stringify({error:error.message}), {status:400,headers:{'Content-Type':'application/json'}})
    return new Response(JSON.stringify({ok:true}), {headers:{'Content-Type':'application/json'}})
  }

  const { data, error } = await admin.from('profiles').select('id,email,name,role,active,created_at').order('created_at',{ascending:true})
  if (error) return new Response(JSON.stringify({error:error.message}), {status:500,headers:{'Content-Type':'application/json'}})
  return new Response(JSON.stringify({users:data||[]}), {headers:{'Content-Type':'application/json'}})
})
