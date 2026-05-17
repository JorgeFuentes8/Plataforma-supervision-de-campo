# Instalación y ejecución

## Requisitos previos

Para ejecutar el proyecto es necesario tener instalado:

- Docker Desktop
- Git

No es necesario instalar manualmente Python, Node.js ni PostgreSQL, ya que todo se ejecuta mediante Docker Compose.

---

## 1. Clonar el repositorio

```powershell
git clone https://github.com/JorgeFuentes8/Plataforma-supervision-de-campo.git
cd Plataforma-supervision-de-campo
```

---

## 2. Crear el archivo de variables de entorno

El proyecto incluye un archivo `.env.example` con las variables necesarias para ejecutar la aplicación.

Hay que crear una copia llamada `.env`.

### Windows PowerShell / CMD

```powershell
copy .env.example .env
```

### Mac / Linux

```bash
cp .env.example .env
```


## 3. Levantar la aplicación con Docker

La primera vez se recomienda ejecutar:

```powershell
docker compose up --build
```

Este comando levanta automáticamente:

- Base de datos PostgreSQL
- Backend FastAPI
- Frontend Next.js

Cuando los servicios estén arrancados, se podrá acceder a:

- Frontend: http://localhost:3000
- API / Swagger: http://localhost:8000/docs

---

## 4. Usuario demo

Al iniciar la aplicación se crea automáticamente un usuario de prueba:

```text
email: demo@agforest.local
password: demo123
```

Con este usuario se puede acceder a la plataforma y probar el flujo completo.

---

## 5. Uso básico de la aplicación

Una vez iniciada la sesión, se puede probar el siguiente flujo:

1. Acceder al dashboard.
2. Crear o consultar proyectos.
3. Registrar visitas asociadas a un proyecto.
4. Subir fotos, documentos PDF y audios.
5. Crear o editar plantillas de informe.
6. Generar un borrador de informe seleccionando una plantilla.
7. Exportar el informe como HTML o PDF.

La aplicación incluye datos demo.

---

## 6. Configuración opcional de OpenAI

La aplicación puede funcionar sin clave de OpenAI gracias a un fallback local.

Para activar la generación real mediante IA y la transcripción automática de audios, hay que editar el archivo `.env` y añadir:

```env
OPENAI_API_KEY=tu_api_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1
```

Con esta configuración, el backend utiliza OpenAI para:

- generar borradores de informe respetando la plantilla seleccionada;
- transcribir audios adjuntos a las visitas.

Si no se configura `OPENAI_API_KEY`, la aplicación sigue funcionando con una generación local básica para poder probar el flujo completo.

---

## 7. Configuración opcional de Cloudinary

Por defecto, los archivos se guardan localmente en:

```text
backend/uploads
```

También se puede utilizar Cloudinary como almacenamiento externo configurando estas variables en `.env`:

```env
STORAGE_BACKEND=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Si estas variables no se configuran, la aplicación seguirá funcionando correctamente con almacenamiento local.

---