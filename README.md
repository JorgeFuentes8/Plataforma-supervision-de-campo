# AGFOREST – Plataforma de Supervisión de Campo

Mini aplicación web para gestionar proyectos de supervisión, registrar visitas con documentos/audio/fotos, crear plantillas de informe y generar borradores con IA exportables a PDF o HTML.

## Funcionalidades cubiertas

- Autenticación básica JWT con bcrypt.
- Dashboard con resumen de proyectos, visitas, informes y plantillas.
- CRUD de proyectos con nombre, cliente y descripción.
- Registro de visitas por proyecto con fecha, notas, PDFs, audios y al menos una foto.
- Extracción de texto de PDFs.
- Transcripción de audio con OpenAI cuando se configura `OPENAI_API_KEY`.
- Gestión de plantillas con secciones, instrucciones de IA y campos obligatorios.
- Generación de borrador de informe respetando la estructura de la plantilla.
- Exportación de informes a `.html` y `.pdf`.
- Swagger/OpenAPI automático en FastAPI.
- PostgreSQL, Cloudinary opcional y fallback local para archivos.

## Arranque rápido

```bash
cp .env.example .env
docker compose up --build
```

Abre:

- Frontend: http://localhost:3000
- Swagger: http://localhost:8000/docs

Credenciales demo:

```text
Email: demo@agforest.local
Password: demo1234
```

## Flujo de prueba

1. Entra con el usuario demo.
2. Abre `Proyectos` y selecciona `Arbolado Urbano – Centro`.
3. Revisa la visita demo o crea una nueva visita con una foto.
4. Ve a `Plantillas` y edita la plantilla `Informe técnico – Consejería`.
5. Desde el proyecto, pulsa `Generar informe`.
6. Selecciona una plantilla, revisa el borrador y genera el informe final.
7. Exporta el informe desde el botón `Exportar`.

## Variables relevantes

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1
STORAGE_BACKEND=local
```

Sin `OPENAI_API_KEY` la aplicación usa un generador local para  probar todo el flujo. Con clave de OpenAI, usa la API para redactar el informe y transcribir audios.

Para usar Cloudinary cambia:

```env
STORAGE_BACKEND=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Endpoints principales

- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET/POST /api/projects`
- `GET/PUT/DELETE /api/projects/{id}`
- `GET/POST /api/projects/{id}/visits`
- `GET /api/visits/{id}`
- `GET/POST /api/templates`
- `GET/PUT/DELETE /api/templates/{id}`
- `POST /api/projects/{id}/reports/preview`
- `POST /api/projects/{id}/reports`
- `GET /api/reports/{id}`
- `GET /api/reports/{id}/export/pdf`
- `GET /api/reports/{id}/export/html`
