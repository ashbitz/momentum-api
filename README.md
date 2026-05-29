# ⚡ Momentum API

Backend propio para Momentum, una app móvil de seguimiento personal centrada en hábitos, tareas y notas rápidas.

Esta API permite guardar los datos en PostgreSQL mediante Neon, evitando depender solo del almacenamiento local del dispositivo. La app móvil puede consumir estos endpoints para sincronizar hábitos, registros diarios, tareas, notas y etiquetas desde la nube.

Repositorio de la app móvil: https://github.com/ashbitz/momentum

---

## 📱 Relación con Momentum

Momentum se organiza alrededor de tres entidades principales:

- **Habits** → hábitos con objetivo, unidad, color y registros diarios.
- **Tasks** → tareas con estado, prioridad, categoría y fecha opcional.
- **Notes** → notas rápidas con contenido, color y etiquetas.

El backend mantiene esa misma idea y añade una base de datos relacional para que los datos puedan vivir fuera del dispositivo.

---

## 🛠 Tecnologías

| Tecnología | Uso |
| --- | --- |
| Next.js | API REST con App Router |
| TypeScript | Tipado del backend |
| PostgreSQL | Base de datos relacional |
| Neon | Hosting de PostgreSQL en la nube |
| Zod | Validación de datos recibidos |
| @neondatabase/serverless | Conexión entre Next.js y Neon |
| Vercel | Despliegue del backend |

---

## 🧱 Estructura principal

```txt
momentum-api/
├── app/
│   └── api/
│       ├── health/
│       ├── habits/
│       ├── habit-logs/
│       ├── tasks/
│       ├── notes/
│       └── note-tags/
├── docs/
│   ├── backend-teoria.md
│   └── seguridad-api.md
├── lib/
│   └── db.ts
├── sql/
│   ├── schema.sql
│   └── queries.sql
├── .env.example
├── package.json
└── README.md
```

---

## 🔐 Variables de entorno

El proyecto necesita una variable de entorno para conectar con Neon:

```env
DATABASE_URL=
```

En local debe crearse un archivo `.env.local` con el connection string real de Neon.

El archivo `.env.local` no debe subirse a GitHub. Solo se sube `.env.example` como plantilla.

---

## ▶️ Ejecución en local

Instalar dependencias:

```bash
npm install
```

Arrancar el servidor de desarrollo:

```bash
npm run dev
```

La API queda disponible en:

```txt
http://localhost:3000/api
```

Endpoint rápido para comprobar conexión con Neon:

```txt
http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

---

## 🗄 Base de datos

El esquema SQL está guardado en:

```txt
sql/schema.sql
```

Incluye las tablas:

- `habits`
- `habit_logs`
- `tasks`
- `notes`
- `note_tags`

Las consultas relacionales de referencia están en:

```txt
sql/queries.sql
```

Ahí se documentan consultas con `LEFT JOIN` para obtener hábitos con sus registros y notas con sus etiquetas.

---

## 🌐 Endpoints

### Health

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Comprueba que la API conecta con Neon |

---

### Habits

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/habits` | Lista todos los hábitos |
| POST | `/api/habits` | Crea un hábito |
| GET | `/api/habits/[id]` | Obtiene un hábito concreto |
| PATCH | `/api/habits/[id]` | Actualiza parcialmente un hábito |
| DELETE | `/api/habits/[id]` | Elimina un hábito |

Body de creación:

```json
{
  "title": "Read 20 pages",
  "description": "Daily reading habit",
  "frequency": "daily",
  "color": "#6366F1",
  "target": 20,
  "unit": "pages"
}
```

---

### Habit logs

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/habits/[id]/logs` | Lista los registros diarios de un hábito |
| POST | `/api/habits/[id]/logs` | Crea un registro diario |
| PATCH | `/api/habit-logs/[logId]` | Actualiza un registro diario |
| DELETE | `/api/habit-logs/[logId]` | Elimina un registro diario |

Body de creación:

```json
{
  "log_date": "2026-05-28",
  "value": 1,
  "is_completed": true
}
```

Estos registros preparan la base para mostrar un heatmap de hábitos en la app móvil.

---

### Tasks

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tasks` | Lista todas las tareas |
| POST | `/api/tasks` | Crea una tarea |
| GET | `/api/tasks/[id]` | Obtiene una tarea concreta |
| PATCH | `/api/tasks/[id]` | Actualiza parcialmente una tarea |
| DELETE | `/api/tasks/[id]` | Elimina una tarea |

Body de creación:

```json
{
  "title": "Prepare API documentation",
  "description": "Write backend docs for Momentum",
  "category": "project",
  "priority": "high",
  "due_date": "2026-05-30",
  "is_completed": false
}
```

---

### Notes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/notes` | Lista todas las notas |
| POST | `/api/notes` | Crea una nota |
| GET | `/api/notes/[id]` | Obtiene una nota concreta |
| PATCH | `/api/notes/[id]` | Actualiza parcialmente una nota |
| DELETE | `/api/notes/[id]` | Elimina una nota |

Body de creación:

```json
{
  "title": "Backend ideas",
  "content": "Ideas for improving Momentum API documentation",
  "color": "#F59E0B",
  "is_pinned": true
}
```

---

### Note tags

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/notes/[id]/tags` | Lista las etiquetas de una nota |
| POST | `/api/notes/[id]/tags` | Añade una etiqueta a una nota |
| DELETE | `/api/note-tags/[tagId]` | Elimina una etiqueta |

Body de creación:

```json
{
  "tag": "backend"
}
```

---

## ✅ Comprobación del proyecto

Para revisar el código:

```bash
npm run lint
```

Flujo básico de prueba:

1. Comprobar `/api/health`.
2. Crear y listar hábitos.
3. Crear registros diarios de hábitos.
4. Crear, actualizar y eliminar tareas.
5. Crear, actualizar y eliminar notas.
6. Añadir y eliminar etiquetas de notas.
7. Comprobar que los datos aparecen en Neon.

---

## 📚 Documentación

La documentación principal está en:

- `docs/backend-teoria.md`
- `docs/seguridad-api.md`

---

## 👨‍💻 Autor

Ashbitz
