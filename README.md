# Live Market

Demo SaaS de social commerce para negocios que venden por TikTok Live, Facebook Live, Instagram, WhatsApp o transmisiones en vivo.

La marca visible es **Live Market**.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Supabase Auth
- Supabase Database + RLS
- Supabase Realtime
- Supabase Storage para imagenes
- Vercel

## Rutas

- `/`: landing principal.
- `/urbanstyle`: tienda demo Urban Style.
- `/zapasvip`: tienda demo Zapas VIP.
- `/login`: inicio de sesion.
- `/admin`: dashboard.
- `/admin/productos`: productos, imagenes, variantes y stock.
- `/admin/live`: modo live.
- `/admin/pedidos`: pedidos, etiquetas y exportacion.
- `/admin/configuracion`: configuracion de tienda.
- `/platform`: panel interno de plataforma.

## Probar sin Supabase

Si no configuras `.env.local`, la app usa modo demo local en `localStorage`.

```bash
npm install
npm run dev
```

Abre:

```text
http://localhost:3000
http://localhost:3000/urbanstyle
http://localhost:3000/zapasvip
http://localhost:3000/login
```

Acceso demo:

```text
Email: demo@livemarket.pe
Clave: 123456
```

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre SQL Editor.
3. Ejecuta completo `database.sql`.
4. Ve a Project Settings > API.
5. Copia Project URL y anon public key.
6. Crea `.env.local` basado en `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

No uses `service_role` en frontend.

## Crear usuarios y tiendas

1. Crea usuarios en Supabase Auth.
2. Para platform admin:

```sql
insert into platform_admins (email)
values ('admin@tuempresa.com')
on conflict do nothing;
```

3. Para asociar un usuario a una tienda:

```sql
insert into store_members (store_id, user_id, role)
values ('ID_TIENDA', 'ID_USUARIO_AUTH', 'store_owner');
```

Roles:

- `platform_admin`: administra la plataforma.
- `store_owner`: administra una tienda.
- `store_staff`: trabaja dentro de una tienda.

## Storage

El script crea el bucket publico `product-images`.

Desde `/admin/productos` puedes subir una imagen. La app usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` y RLS/policies de Storage; no usa `service_role`.

## Realtime

`live_state` esta agregado a `supabase_realtime`. Cuando una tienda cambia producto en `/admin/live`, la tienda publica puede recibir el cambio con Supabase Realtime.

## Flujo cliente

1. Entra a `/urbanstyle` o `/zapasvip`.
2. Ve producto en vivo.
3. Busca producto por codigo.
4. Elige variante.
5. Agrega al pedido.
6. Llena datos de envio.
7. Presiona **Enviar cotizacion por WhatsApp**.
8. Se crea el pedido en Supabase.
9. Se abre WhatsApp con resumen, total y datos de envio.

## Flujo tienda

1. Entra a `/login`.
2. Selecciona tienda si pertenece a mas de una.
3. Sube productos y crea variantes.
4. En `/admin/live`, selecciona producto actual.
5. En `/admin/pedidos`, copia atencion, imprime etiqueta o exporta CSV.
6. En `/admin/configuracion`, cambia WhatsApp, logo, color y texto publico.

## Flujo plataforma

1. Entra a `/platform` con un usuario en `platform_admins`.
2. Crea tiendas.
3. Asigna usuarios.
4. Revisa plan, estado y pedidos por tienda.

## Desplegar en Vercel

1. Sube el proyecto a GitHub.
2. Importa el repo en Vercel.
3. Agrega variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

No necesitas build command especial. Vercel detecta Next.js.

## Validacion recomendada

- `/urbanstyle` muestra solo ropa.
- `/zapasvip` muestra solo zapatillas.
- Login funciona.
- Crear producto en Urban Style no aparece en Zapas VIP.
- Live de una tienda no afecta la otra.
- Crear cotizacion abre WhatsApp correcto.
- Pedidos y CSV son por tienda.
- Etiqueta incluye datos de envio.
- Consola sin errores.

## Nota de revision ChatGPT

Para una demo publica, la pantalla de login solo muestra las credenciales demo cuando Supabase no esta configurado. Al configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, el login queda limpio para usuarios reales.

El panel `/platform` puede asignar usuarios a tiendas si el usuario ya existe en Supabase Auth. Primero crea el usuario en **Authentication > Users** y luego asi­gnalo desde `/platform` con su correo.
