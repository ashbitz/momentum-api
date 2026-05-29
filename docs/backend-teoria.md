# 🧠 Backend y base de datos en Momentum

## 🔍 Objetivo de esta fase

En esta fase Momentum pasa de depender solo del almacenamiento local del móvil a tener un backend propio con base de datos en la nube.

La idea es que la app móvil no guarde toda la información únicamente en el dispositivo, sino que pueda comunicarse con una API REST. Esa API valida los datos, ejecuta consultas seguras y guarda la información en PostgreSQL mediante Neon.

---

## 🧩 Patrón cliente-servidor

Momentum se divide en tres partes:

- **Cliente** → la app móvil hecha con Expo y React Native.
- **Servidor** → la API creada con Next.js.
- **Base de datos** → PostgreSQL alojado en Neon.

La app móvil no se conecta directamente a PostgreSQL. En su lugar, llama a la API.

Este patrón permite separar responsabilidades:

| Capa | Responsabilidad |
| --- | --- |
| App móvil | Mostrar pantallas y enviar acciones del usuario |
| API | Validar datos, aplicar reglas y responder con JSON |
| Base de datos | Guardar y consultar la información |

Así el connection string de PostgreSQL queda protegido en el backend y no aparece dentro de la app móvil.

---

## 🌐 API REST

Una API REST expone rutas HTTP para trabajar con datos.

En Momentum cada grupo de datos tiene sus propios endpoints:

- `/api/habits`
- `/api/habit-logs`
- `/api/tasks`
- `/api/notes`
- `/api/note-tags`

La API responde en formato JSON, que es fácil de consumir desde la app móvil.

---

## 📡 Métodos HTTP usados

| Método | Uso en Momentum |
| --- | --- |
| GET | Leer hábitos, tareas, notas, logs o etiquetas |
| POST | Crear nuevos datos |
| PATCH | Actualizar solo algunos campos |
| DELETE | Eliminar datos |

Ejemplo:

```txt
GET /api/tasks
```

Devuelve la lista de tareas.

```txt
PATCH /api/tasks/[id]
```

Actualiza parcialmente una tarea concreta.

---

## ✅ Códigos de estado

La API utiliza códigos HTTP para indicar el resultado de cada operación.

| Código | Significado |
| --- | --- |
| 200 OK | La petición se ha completado correctamente |
| 201 Created | Se ha creado un nuevo recurso |
| 204 No Content | Se ha eliminado un recurso sin devolver cuerpo |
| 400 Bad Request | Los datos enviados no son válidos |
| 404 Not Found | El recurso solicitado no existe |
| 500 Internal Server Error | Error interno del servidor |

Los errores internos no devuelven detalles de PostgreSQL al cliente. La API responde con un mensaje genérico para no exponer información sensible.

---

## 🗄 Base de datos relacional

Momentum usa PostgreSQL como base de datos relacional.

Una base relacional organiza los datos en tablas. Cada tabla representa una entidad del dominio y cada fila representa un registro concreto.

En este backend se han creado estas tablas:

| Tabla | Uso |
| --- | --- |
| `habits` | Guarda los hábitos del usuario |
| `habit_logs` | Guarda los registros diarios de cada hábito |
| `tasks` | Guarda tareas |
| `notes` | Guarda notas rápidas |
| `note_tags` | Guarda etiquetas asociadas a notas |

El esquema completo está en `sql/schema.sql`.

---

## 🔑 Primary Key y UUID

Cada tabla tiene una columna `id` como clave primaria.

Se usa `UUID` en lugar de un número autoincremental porque encaja bien con aplicaciones móviles y sincronización. Un UUID permite identificar registros de forma única sin depender de un contador central.

Ejemplo:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

## 🔗 Foreign Key y ON DELETE CASCADE

Algunas tablas dependen de otras.

Por ejemplo, un registro diario pertenece a un hábito:

```txt
habits 1 ─── N habit_logs
```

Y una etiqueta pertenece a una nota:

```txt
notes 1 ─── N note_tags
```

Esto se representa con claves foráneas.

Ejemplo:

```sql
habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE
```

`ON DELETE CASCADE` significa que, si se borra un hábito, también se borran automáticamente sus registros diarios. Así se evita dejar datos huérfanos en la base de datos.

---

## 🧱 Tablas principales

### `habits`

Guarda los hábitos creados en Momentum.

Campos principales:

- `title`
- `description`
- `frequency`
- `color`
- `target`
- `unit`
- `is_active`

### `habit_logs`

Guarda el progreso diario de cada hábito.

Campos principales:

- `habit_id`
- `log_date`
- `value`
- `is_completed`

Esta tabla sirve como base para crear un heatmap de hábitos tipo calendario de actividad.

### `tasks`

Guarda tareas sencillas.

Campos principales:

- `title`
- `description`
- `category`
- `priority`
- `due_date`
- `is_completed`

### `notes`

Guarda notas rápidas.

Campos principales:

- `title`
- `content`
- `color`
- `is_pinned`

### `note_tags`

Guarda etiquetas asociadas a notas.

Campos principales:

- `note_id`
- `tag`

---

## 🧾 DDL y DML

En SQL se pueden separar dos tipos de operaciones:

| Tipo | Uso | Ejemplos |
| --- | --- | --- |
| DDL | Define estructura | `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` |
| DML | Manipula datos | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |

En Momentum:

- `sql/schema.sql` usa DDL para crear las tablas.
- Los endpoints usan DML para leer, crear, actualizar y eliminar datos.

---

## 🔄 JOINs

Los JOINs permiten combinar datos de varias tablas relacionadas.

En Momentum se usan especialmente para obtener:

- hábitos junto con sus registros diarios;
- notas junto con sus etiquetas.

### INNER JOIN

`INNER JOIN` devuelve solo los registros que tienen coincidencia en ambas tablas.

Ejemplo de uso posible: obtener solo hábitos que ya tienen registros diarios.

### LEFT JOIN

`LEFT JOIN` devuelve todos los registros de la tabla principal aunque no tengan coincidencias en la tabla relacionada.

Este caso encaja mejor con Momentum porque un hábito puede existir aunque todavía no tenga logs, y una nota puede existir aunque no tenga etiquetas.

Ejemplo:

```sql
SELECT
  h.id,
  h.title,
  COALESCE(
    json_agg(hl.*) FILTER (WHERE hl.id IS NOT NULL),
    '[]'
  ) AS logs
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id
GROUP BY h.id;
```

Las consultas completas están guardadas en `sql/queries.sql`.

---

## 🧪 Validación con Zod

La API valida los datos antes de insertarlos o actualizarlos.

Por ejemplo, un hábito debe tener un título de al menos tres caracteres y el color debe tener formato hexadecimal.

Esto evita guardar datos incompletos o mal formados en PostgreSQL.

---

## ✅ Resultado de la fase backend

Con esta base, Momentum ya tiene una API REST preparada para trabajar con datos reales en la nube.

El backend cubre las entidades principales de la app y deja preparada la parte de registros diarios para futuras visualizaciones, como el heatmap de hábitos.
