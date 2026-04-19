# TG Marketplace — Cannabis Store Mini App

**Date:** 2026-04-19  
**Status:** Approved

---

## Overview

Telegram Mini App para venta de productos de cannabis (pre-rolls, gomitas, aceites). Los clientes compran desde Telegram, pagan con USDT en la red TON vía QR, reciben delivery a domicilio. El admin recibe pedidos en Telegram y gestiona desde un panel web CMS.

---

## Stack

| Capa | Tecnología |
|---|---|
| Mini App (frontend) | Next.js 15 App Router + Tailwind CSS |
| Backend / API | Next.js Route Handlers (Vercel Functions) |
| Base de datos | Supabase (PostgreSQL + Realtime) |
| Autenticación admin | Supabase Auth |
| Bot de Telegram | grammY (Node.js) desplegado en Vercel |
| Pagos | USDT-TON — QR generado en backend, polling de confirmación on-chain |
| Deploy | Vercel |
| Estilo visual | Dark Premium — fondo #0d0d0d, acento #c9f04a |

---

## Pantallas (flujo cliente)

### 1. Age Gate
- Pantalla de bienvenida con logo y mensaje "+18"
- Botón "Soy mayor de 18" → guarda flag en `localStorage` + estado React
- Sin este paso no se puede acceder al catálogo
- Usa `initData` de Telegram para pre-identificar al usuario

### 2. Catálogo
- Grid 2 columnas de productos
- Filtros por categoría: Todos · Pre-rolls · Gomitas · Aceites
- Cada card muestra: imagen/emoji, nombre, descripción corta, precio en USD, botón "+"
- Catálogo cargado desde Supabase tabla `products`

### 3. Detalle de producto
- Imagen grande, nombre, tags (cepa, peso, tipo), descripción completa
- Selector de cantidad (−/+)
- Botón "Agregar al carrito"

### 4. Carrito
- Lista de items con imagen, nombre, cantidad, subtotal por item
- Costo de delivery fijo (configurable en CMS)
- Total en USD
- Botón "Ir a pagar"

### 5. Checkout
- Campo de dirección de entrega (texto libre — sin mapa en v1)
- Campo de nota opcional al repartidor
- Resumen del pedido
- Botón "Confirmar pedido · $XX.XX"

### 6. QR de Pago
- Se genera una dirección USDT-TON única por pedido
- Se muestra QR + dirección copiable
- Temporizador de 15 minutos
- Botón "Abrir wallet" (deep link a Telegram Wallet)
- Backend hace polling cada 10s a la API de TON para detectar el pago
- Al confirmar → navega a pantalla de confirmación

### 7. Confirmación
- Mensaje de éxito con número de pedido
- Resumen de items
- Tiempo estimado de entrega (configurable)
- Hash de transacción confirmada

---

## Panel Admin (Web CMS)

Ruta protegida `/admin` en la misma app Next.js. Acceso con usuario/contraseña via Supabase Auth.

### Secciones
- **Dashboard:** pedidos del día, ventas totales del día, pedidos en curso
- **Pedidos:** lista en tiempo real (Supabase Realtime), estados: Nuevo → Aceptado → En camino → Entregado
- **Productos:** CRUD completo — nombre, descripción, categoría, precio, imagen, activo/inactivo
- **Configuración:** costo de delivery, tiempo estimado, dirección TON receptora, mensaje de bienvenida

---

## Bot de Telegram (Admin)

El bot notifica al admin (o grupo de admins) cuando llega un pedido confirmado.

### Mensaje de notificación
```
🛒 Nuevo pedido #0042

👤 @username
📍 Dirección de entrega

─────────────
🌿 Pre-roll OG Kush ×1 — $12.00
🍬 Gomita CBD Fresa ×2 — $16.00
🚚 Delivery — $3.00
─────────────
💰 Total: $31.00 USDT
✅ Pago confirmado · Tx: 0x3f8a...c2
```

### Botones inline
- ✅ Aceptar — cambia estado a "Aceptado" en Supabase, notifica al cliente
- ❌ Rechazar — cambia estado a "Rechazado", notifica al cliente con motivo
- 📋 Ver detalles — enlace al CMS web

---

## Base de datos (Supabase)

### Tabla `products`
| campo | tipo |
|---|---|
| id | uuid PK |
| name | text |
| description | text |
| category | enum: preroll, gummy, oil, other |
| price_usd | decimal |
| image_url | text |
| active | boolean |
| created_at | timestamptz |

### Tabla `orders`
| campo | tipo |
|---|---|
| id | uuid PK |
| order_number | serial |
| telegram_user_id | bigint |
| telegram_username | text |
| items | jsonb (array de {product_id, name, qty, price}) |
| delivery_address | text |
| delivery_note | text |
| subtotal_usd | decimal |
| delivery_fee_usd | decimal |
| total_usd | decimal |
| ton_address | text (dirección única generada) |
| ton_tx_hash | text |
| status | enum: pending_payment, paid, accepted, on_the_way, delivered, rejected |
| created_at | timestamptz |

### Tabla `config`
| campo | tipo |
|---|---|
| key | text PK |
| value | text |

Claves: `delivery_fee`, `estimated_time`, `ton_wallet_address`, `welcome_message`

---

## Flujo de pago (detalle técnico)

1. Cliente confirma pedido → backend crea registro en `orders` con status `pending_payment` y `expires_at = now + 15min`
2. Backend usa **dirección TON maestra única** con un **memo/comment único por pedido** (ej: `ORD-0042`) para identificar cada pago — más simple que derivar direcciones
3. Se genera QR con `ton://` URI incluyendo el memo y monto. Se devuelve QR + dirección al cliente
4. **El cliente** hace polling al endpoint `/api/orders/[id]/status` cada 5 segundos (no hay job server-side de larga duración, compatible con Vercel Functions)
5. Cada llamada al endpoint consulta la TON API buscando txs recientes al address con el memo correcto y monto ≥ total del pedido
6. Al detectar tx válida → actualiza `orders.status = 'paid'`, guarda tx hash. La respuesta del endpoint lleva el nuevo status al cliente
7. Cliente navega a confirmación. Bot envía notificación al admin con botones inline

---

## Arquitectura de despliegue

```
Telegram Client
    ↕ (Mini App WebView)
Next.js en Vercel
    ├── /app → Mini App (cliente)
    ├── /app/admin → CMS (admin, protegido)
    ├── /api/orders → crear pedido, polling pago
    ├── /api/products → catálogo
    └── /api/webhook → recibe callbacks del bot Telegram
         ↕
      Supabase
    (PostgreSQL + Realtime + Auth)
         ↕
      grammY Bot
    (Vercel Function o proceso separado)
```

---

## Consideraciones de seguridad

- Validar `initData` de Telegram en cada request del Mini App para verificar que el usuario es legítimo
- Dirección TON única por pedido para evitar colisiones de pago
- Timeout de 15 min en pagos — si no se confirma, el pedido se cancela automáticamente
- Panel admin protegido con autenticación Supabase (email + password)
- Variables sensibles (token del bot, claves Supabase) en Vercel environment variables

---

## Out of scope (v1)

- Múltiples tiendas / multivendor
- Sistema de descuentos / cupones
- Reviews de productos
- Historial de pedidos en la Mini App
- Push notifications al cliente (más allá del bot)
- Integración con sistema de inventario externo
