# 🧪 Pruebas de la API

## 🔍 Objetivo

Este documento resume las pruebas realizadas sobre la API de Momentum durante la Fase 7.

La API está desplegada en Vercel y conectada a PostgreSQL mediante Neon. Las pruebas sirven para comprobar que los endpoints principales responden correctamente y que la app móvil puede trabajar con datos reales en la nube.

URL base de producción:

```txt
https://momentum-api-ten.vercel.app
```

---

## 🛠 Herramientas usadas

Las pruebas se han realizado combinando:

- navegador para comprobar endpoints `GET` sencillos;
- PowerShell para peticiones `POST`, `PATCH` y `DELETE`;
- revisión visual de los datos creados desde la app móvil;
- comprobación de registros en Neon.

Este enfoque permite comprobar tanto la API como la integración real con la app Momentum.

---

## ✅ Comprobación general

| Método | Ruta          | Resultado esperado            |
| ------ | ------------- | ----------------------------- |
| GET    | `/api/health` | Devuelve `{ "status": "ok" }` |

Este endpoint confirma que el backend está desplegado y que puede conectar correctamente con Neon.

---

## 🌱 Habits

| Método | Ruta               | Resultado esperado                            |
| ------ | ------------------ | --------------------------------------------- |
| GET    | `/api/habits`      | Devuelve la lista de hábitos                  |
| POST   | `/api/habits`      | Crea un hábito y devuelve `201 Created`       |
| GET    | `/api/habits/[id]` | Devuelve un hábito concreto                   |
| PATCH  | `/api/habits/[id]` | Actualiza parcialmente un hábito              |
| DELETE | `/api/habits/[id]` | Elimina un hábito y devuelve `204 No Content` |

Ejemplo de creación:

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

También se comprobó desde la app móvil que los hábitos creados en la API aparecen en la pestaña Habits.

---

## 📆 Habit logs

| Método | Ruta                      | Resultado esperado                                     |
| ------ | ------------------------- | ------------------------------------------------------ |
| GET    | `/api/habits/[id]/logs`   | Devuelve los registros diarios de un hábito            |
| POST   | `/api/habits/[id]/logs`   | Crea un registro diario y devuelve `201 Created`       |
| PATCH  | `/api/habit-logs/[logId]` | Actualiza un registro diario                           |
| DELETE | `/api/habit-logs/[logId]` | Elimina un registro diario y devuelve `204 No Content` |

Ejemplo de creación:

```json
{
  "log_date": "2026-05-28",
  "value": 1,
  "is_completed": true
}
```

Estos registros son la base para poder mostrar más adelante un heatmap de hábitos en la app móvil.

---

## ✅ Tasks

| Método | Ruta              | Resultado esperado                            |
| ------ | ----------------- | --------------------------------------------- |
| GET    | `/api/tasks`      | Devuelve la lista de tareas                   |
| POST   | `/api/tasks`      | Crea una tarea y devuelve `201 Created`       |
| GET    | `/api/tasks/[id]` | Devuelve una tarea concreta                   |
| PATCH  | `/api/tasks/[id]` | Actualiza parcialmente una tarea              |
| DELETE | `/api/tasks/[id]` | Elimina una tarea y devuelve `204 No Content` |

Ejemplo de creación:

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

También se comprobó desde la app móvil que las tareas se pueden crear, listar, marcar como completadas o pendientes y eliminar usando la API.

---

## 📝 Notes

| Método | Ruta              | Resultado esperado                           |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/api/notes`      | Devuelve la lista de notas                   |
| POST   | `/api/notes`      | Crea una nota y devuelve `201 Created`       |
| GET    | `/api/notes/[id]` | Devuelve una nota concreta                   |
| PATCH  | `/api/notes/[id]` | Actualiza parcialmente una nota              |
| DELETE | `/api/notes/[id]` | Elimina una nota y devuelve `204 No Content` |

Ejemplo de creación:

```json
{
  "title": "Backend ideas",
  "content": "Ideas for improving Momentum API documentation",
  "color": "#F59E0B",
  "is_pinned": true
}
```

También se comprobó desde la app móvil que las notas se crean, aparecen en el listado, se pueden abrir en detalle y eliminar.

---

## 🏷 Note tags

| Método | Ruta                     | Resultado esperado                                     |
| ------ | ------------------------ | ------------------------------------------------------ |
| GET    | `/api/notes/[id]/tags`   | Devuelve las etiquetas de una nota                     |
| POST   | `/api/notes/[id]/tags`   | Añade una etiqueta a una nota y devuelve `201 Created` |
| DELETE | `/api/note-tags/[tagId]` | Elimina una etiqueta y devuelve `204 No Content`       |

Ejemplo de creación:

```json
{
  "tag": "backend"
}
```

Esta parte comprueba la relación entre `notes` y `note_tags` mediante claves foráneas.

---

## 🔄 Pruebas desde la app móvil

Además de probar la API directamente, se comprobó que Momentum consume la API desplegada en Vercel.

Flujo probado:

1. Abrir la app en Expo Go.
2. Entrar en Habits, Tasks y Notes.
3. Crear un hábito, una tarea y una nota desde la pantalla de creación.
4. Comprobar que aparecen en sus pestañas correspondientes.
5. Entrar en las pantallas de detalle.
6. Marcar una tarea como completada o pendiente.
7. Eliminar elementos y comprobar que desaparecen.
8. Cerrar y volver a abrir la app para confirmar que los datos siguen estando disponibles desde la API.

---

## 📌 Resultado

Las pruebas confirman que la API REST de Momentum funciona en producción, que las operaciones principales responden con los códigos esperados y que la app móvil ya consume datos reales desde Vercel y Neon.
