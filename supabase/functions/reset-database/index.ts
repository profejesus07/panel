// Edge Function: reset-database
//
// Borra TODA la información del colegio y todas las cuentas de acceso,
// excepto la del administrador que la ejecuta. Es irreversible.
//
// Qué se elimina:
//   - Todas las cuentas de auth.users (y sus profiles, por cascada) salvo la
//     de quien llama: ningún estudiante, padre ni otro admin puede volver a
//     iniciar sesión.
//   - Estudiantes, padres/acudientes, cursos, calificaciones, asistencia,
//     justificaciones, convivencia, actas y anuncios.
//   - Los archivos de los buckets justificaciones, actas, boletines y anuncios.
//
// Qué se conserva (no son datos de personas): school_settings y el bucket
// institucion (nombre y escudo del colegio), subjects, academic_periods y
// performance_levels.
//
// Solo un admin autenticado puede invocarla, y además debe reescribir su
// contraseña y la frase de confirmación.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONFIRMATION_PHRASE = 'ELIMINAR TODO'

// En orden de dependencias: primero las tablas que referencian a otras.
const TABLES_TO_WIPE: { table: string; column: string }[] = [
  { table: 'official_records', column: 'id' },
  { table: 'announcements', column: 'id' },
  { table: 'behavior_records', column: 'id' },
  { table: 'absence_justifications', column: 'id' },
  { table: 'attendance', column: 'id' },
  { table: 'grades', column: 'id' },
  { table: 'student_guardians', column: 'student_id' },
  { table: 'students', column: 'id' },
  { table: 'guardians', column: 'id' },
  { table: 'courses', column: 'id' },
]

const BUCKETS_TO_WIPE = ['justificaciones', 'actas', 'boletines', 'anuncios']

interface ResetRequest {
  password?: string
  confirmation?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function deleteAllUsersExcept(adminClient: SupabaseClient, keepId: string): Promise<number> {
  let deleted = 0
  // Se relee siempre la página 1: al borrar, los siguientes usuarios se
  // corren hacia adelante. Termina cuando solo queda el admin que llama.
  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw new Error(`No se pudieron listar los usuarios: ${error.message}`)

    const toDelete = data.users.filter((u) => u.id !== keepId)
    if (toDelete.length === 0) return deleted

    for (const user of toDelete) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
      if (deleteError) throw new Error(`No se pudo eliminar un usuario: ${deleteError.message}`)
      deleted++
    }
  }
}

async function listAllFiles(adminClient: SupabaseClient, bucket: string, prefix = ''): Promise<string[]> {
  const paths: string[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await adminClient.storage.from(bucket).list(prefix, { limit: 1000, offset })
    if (error) throw new Error(`No se pudo listar el bucket ${bucket}: ${error.message}`)
    if (!data || data.length === 0) break

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      // Las carpetas vienen sin id; los archivos siempre lo tienen.
      if (item.id === null) paths.push(...(await listAllFiles(adminClient, bucket, path)))
      else paths.push(path)
    }
    if (data.length < 1000) break
  }
  return paths
}

async function wipeBucket(adminClient: SupabaseClient, bucket: string): Promise<void> {
  const paths = await listAllFiles(adminClient, bucket)
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await adminClient.storage.from(bucket).remove(paths.slice(i, i + 100))
    if (error) throw new Error(`No se pudieron borrar archivos de ${bucket}: ${error.message}`)
  }
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
    console.error('Faltan variables de entorno de Supabase en la función reset-database')
    return jsonResponse({ success: false, error: 'Error de configuración del servidor.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ success: false, error: 'No autorizado.' })
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()

  if (!caller?.email) {
    return jsonResponse({ success: false, error: 'No autorizado.' })
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ success: false, error: 'Solo un administrador puede eliminar la base de datos.' })
  }

  let body: ResetRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Solicitud inválida.' })
  }

  if (body.confirmation !== CONFIRMATION_PHRASE) {
    return jsonResponse({ success: false, error: `Escribe exactamente "${CONFIRMATION_PHRASE}" para confirmar.` })
  }
  if (!body.password) {
    return jsonResponse({ success: false, error: 'Ingresa tu contraseña.' })
  }

  // Se verifica la contraseña con un inicio de sesión aparte, que se cierra
  // de inmediato solo para esta sesión (scope local) sin afectar la del admin.
  const verifyClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: passwordError } = await verifyClient.auth.signInWithPassword({
    email: caller.email,
    password: body.password,
  })
  if (passwordError) {
    return jsonResponse({ success: false, error: 'La contraseña no es correcta.' })
  }
  await verifyClient.auth.signOut({ scope: 'local' })

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  try {
    // Primero las cuentas: lo más importante es que nadie más pueda entrar.
    const deletedUsers = await deleteAllUsersExcept(adminClient, caller.id)

    for (const { table, column } of TABLES_TO_WIPE) {
      const { error } = await adminClient.from(table).delete().not(column, 'is', null)
      if (error) throw new Error(`No se pudo vaciar ${table}: ${error.message}`)
    }

    for (const bucket of BUCKETS_TO_WIPE) {
      await wipeBucket(adminClient, bucket)
    }

    return jsonResponse({ success: true, deleted_users: deletedUsers })
  } catch (error) {
    console.error('reset-database falló', error)
    return jsonResponse({
      success: false,
      error:
        'El borrado no se completó. Vuelve a ejecutarlo para terminar de eliminar lo que falta.',
    })
  }
})
