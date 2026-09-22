// Edge Function: create-user
//
// Único lugar del sistema donde se usa la service_role key de Supabase, y
// solo dentro de este entorno de servidor administrado por Supabase — nunca
// se envía al frontend. Crea la cuenta de acceso (auth.users + profiles)
// para un estudiante o padre/acudiente que el admin ya registró como datos,
// y la vincula a ese registro (students.user_id o guardians.user_id).
//
// Solo un usuario autenticado con role = 'admin' en profiles puede invocarla;
// cualquier otro caso responde success:false sin tocar auth.users.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email?: string
  password?: string
  full_name?: string
  role?: 'estudiante' | 'padre'
  link_id?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function translateCreateError(message: string | undefined): string {
  if (message?.includes('already been registered')) return 'Ya existe una cuenta con ese correo.'
  return 'No se pudo crear el usuario. Verifica los datos e inténtalo de nuevo.'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Faltan variables de entorno de Supabase en la función create-user')
    return jsonResponse({ success: false, error: 'Error de configuración del servidor.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ success: false, error: 'No autorizado.' })
  }

  // Cliente con la identidad del usuario que llama, solo para verificar
  // quién es y qué rol tiene — nunca se usa para las operaciones privilegiadas.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()

  if (!caller) {
    return jsonResponse({ success: false, error: 'No autorizado.' })
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ success: false, error: 'Solo un administrador puede crear cuentas.' })
  }

  let body: CreateUserRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Solicitud inválida.' })
  }

  const { email, password, full_name, role, link_id } = body

  if (!email || !isValidEmail(email)) {
    return jsonResponse({ success: false, error: 'Ingresa un correo válido.' })
  }
  if (!password || password.length < 8) {
    return jsonResponse({ success: false, error: 'La contraseña debe tener al menos 8 caracteres.' })
  }
  if (!full_name?.trim()) {
    return jsonResponse({ success: false, error: 'El nombre completo es obligatorio.' })
  }
  if (role !== 'estudiante' && role !== 'padre') {
    return jsonResponse({ success: false, error: 'Rol inválido.' })
  }
  if (!link_id) {
    return jsonResponse({ success: false, error: 'Falta el registro a vincular.' })
  }

  // Cliente con privilegios de servicio: vive solo dentro de esta función.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const table = role === 'estudiante' ? 'students' : 'guardians'
  const { data: linkRow, error: linkLookupError } = await adminClient
    .from(table)
    .select('id, user_id')
    .eq('id', link_id)
    .single()

  if (linkLookupError || !linkRow) {
    return jsonResponse({ success: false, error: 'El registro a vincular no existe.' })
  }
  if (linkRow.user_id) {
    return jsonResponse({ success: false, error: 'Este registro ya tiene una cuenta de acceso.' })
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return jsonResponse({ success: false, error: translateCreateError(createError?.message) })
  }

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: created.user.id,
    role,
    full_name,
    email,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id)
    return jsonResponse({ success: false, error: 'No se pudo crear el perfil del usuario.' })
  }

  const { error: updateError } = await adminClient
    .from(table)
    .update({ user_id: created.user.id })
    .eq('id', link_id)

  if (updateError) {
    return jsonResponse({
      success: false,
      error: 'El usuario se creó pero no se pudo vincular al registro. Contacta soporte.',
    })
  }

  return jsonResponse({ success: true, user_id: created.user.id })
})
