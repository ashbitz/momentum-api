# 🔐 Seguridad de la API

## 🔍 Objetivo

Este documento resume las decisiones básicas de seguridad aplicadas en la API de Momentum.

El objetivo principal es que la app móvil no tenga acceso directo a la base de datos y que las consultas se hagan de forma controlada desde el backend.

---

## 📱 Por qué la app móvil no se conecta a PostgreSQL

Una app móvil no debe conectarse directamente a PostgreSQL.

Si el connection string estuviera dentro de la app, cualquiera que analizara el binario podría encontrarlo y usarlo para acceder a la base de datos.

Por eso Momentum usa este flujo:

```txt
App móvil → API REST → PostgreSQL en Neon
```

La app solo conoce las rutas de la API. El backend es quien conoce la variable `DATABASE_URL` y decide qué operaciones se pueden hacer.

---

## 🔐 Variables de entorno

La conexión con Neon se guarda en una variable de entorno:

```env
DATABASE_URL=
```

En local, el valor real se guarda en `.env.local`.

Ese archivo no debe subirse a GitHub porque contiene datos privados de conexión.

El repositorio solo incluye `.env.example`, que sirve como plantilla sin secretos.

---

## 🧱 Separación de responsabilidades

La API actúa como capa intermedia entre la app móvil y la base de datos.

Esto permite:

- validar los datos antes de guardarlos;
- controlar qué rutas existen;
- evitar exponer credenciales;
- devolver errores seguros;
- centralizar el acceso a PostgreSQL.

La app móvil no ejecuta SQL. Solo envía peticiones HTTP.

---

## ⚠️ SQL injection

La inyección SQL ocurre cuando se construye una consulta mezclando texto SQL con datos escritos por el usuario.

Ejemplo vulnerable:

```ts
const title = body.title;
const sql = "SELECT * FROM notes WHERE title = '" + title + "'";
```

Si un usuario manipula el valor de `title`, podría alterar la consulta y ejecutar instrucciones no deseadas.

---

## ✅ Consultas parametrizadas

Para evitar SQL injection, Momentum usa consultas parametrizadas.

En lugar de concatenar valores dentro del SQL, se usan placeholders como `$1`, `$2` o `$3`.

Ejemplo:

```ts
await query(
  'SELECT * FROM notes WHERE title = $1',
  [title]
);
```

La base de datos recibe por separado:

- la estructura de la consulta;
- los valores enviados por el usuario.

Así PostgreSQL interpreta los valores como datos, no como código SQL.

---

## 🧪 Validación de datos

Además de usar consultas parametrizadas, la API valida los datos con Zod.

Esto permite comprobar reglas como:

- títulos con longitud mínima;
- colores con formato hexadecimal;
- prioridades válidas en tareas;
- fechas con formato `YYYY-MM-DD`;
- valores numéricos positivos o no negativos.

Si los datos no son válidos, la API responde con `400 Bad Request`.

---

## 🚫 Errores internos

La API no devuelve errores reales de PostgreSQL al cliente.

En caso de fallo interno, se responde con:

```json
{
  "error": "Error interno"
}
```

Esto evita exponer detalles técnicos de la base de datos, nombres internos o información que podría ser útil para atacar el sistema.

---

## 🧩 DELETE y datos relacionados

Las relaciones importantes usan `ON DELETE CASCADE`.

Esto significa que, al borrar un hábito, se eliminan también sus registros diarios. Al borrar una nota, se eliminan sus etiquetas.

Así la base de datos mantiene la coherencia y no deja registros relacionados sin padre.

---

## 🔜 Autenticación

La siguiente mejora lógica es añadir autenticación.

El flujo previsto sería:

- registro de usuario;
- login;
- generación de token JWT;
- envío del token en `Authorization: Bearer token`;
- protección de endpoints privados;
- almacenamiento seguro del token en la app móvil con `expo-secure-store`.

Esta parte pertenece a la evolución de la API cuando se añada gestión de usuarios.
