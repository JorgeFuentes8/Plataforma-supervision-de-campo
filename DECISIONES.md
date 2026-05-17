# Decisiones técnicas

## Enfoque general

El objetivo principal de esta prueba era desarrollar una mini aplicación funcional que cubriese el flujo completo solicitado: creación de proyectos, registro de visitas, subida de documentos, audios e imágenes, gestión de plantillas, generación de informes con IA y exportación final.


El desarrollo se ha realizado partiendo de un planteamiento personal inicial y apoyándome en herramientas de inteligencia artificial como ChatGPT, Codex y agentes de VS Code para acelerar tareas de generación de código y revisión de estructura. 

---

## Stack elegido

### Frontend: Next.js + TypeScript + Tailwind CSS

Inicialmente había valorado utilizar Angular, ya que es el framework con el que más experiencia previa tenía. Sin embargo, llevaba tiempo queriendo probar React en un proyecto más completo, especialmente porque es una tecnología muy utilizada también en entornos de aplicaciones móviles mediante React Native.

Por ese motivo decidí utilizar Next.js. Me parecía una buena oportunidad para trabajar con una estructura moderna basada en React, con rutas organizadas, componentes reutilizables y una experiencia de desarrollo rápida. Para una aplicación como esta, con varias secciones diferenciadas —dashboard, proyectos, visitas, plantillas e informes— encajaba bastante bien.

He utilizado TypeScript para tener más control sobre los datos. En esta aplicación hay varias entidades relacionadas entre sí, como proyectos, visitas, plantillas, archivos e informes, por lo que tiparlas ayuda a reducir errores y facilita el mantenimiento.

Para los estilos he elegido Tailwind CSS porque permite construir interfaces de forma rápida y consistente. 
---

### Backend: FastAPI

Para el backend he utilizado FastAPI porque, para las necesidades de esta prueba, era más que suficiente y permitía avanzar rápido. La aplicación requería una API REST clara, autenticación básica, subida de archivos, conexión con base de datos y documentación de endpoints.

FastAPI encaja muy bien en este caso porque permite definir rutas de forma sencilla, validar datos con Pydantic y generar automáticamente documentación Swagger en `/docs`. Esto resulta útil tanto para desarrollar como probar los endpoints sin tener que usar herramientas externas.

Además, al trabajar con Python, la integración con librerías de IA, extracción de texto de PDFs y generación de PDFs resulta bastante cómoda.

---

### Base de datos: PostgreSQL + SQLAlchemy

He elegido PostgreSQL porque el modelo de datos de la aplicación. Hay usuarios, proyectos, visitas, archivos asociados a visitas, plantillas e informes generados. Todas estas entidades tienen relaciones entre sí, por lo que una base de datos relacional era una opción lógica.

PostgreSQL es una base de datos robusta, y suficiente para cubrir la parte de persistencia.

Para trabajar con la base de datos he utilizado SQLAlchemy como ORM. Esto permite modelar las entidades desde Python y mantener el código más organizado, evitando tener consultas SQL repartidas por toda la aplicación.

---

### Autenticación: JWT + bcrypt

La autenticación implementada es básica, con JWT Bearer y contraseñas hasheadas con bcrypt.

Para este mini desarrollo me parecía una solución adecuada: permite proteger los endpoints privados, mantener sesiones desde el frontend y evitar añadir complejidad innecesaria con OAuth u otros sistemas más avanzados.

Aunque sea una prueba técnica, las contraseñas no se guardan en texto plano. Por eso se usa bcrypt para almacenarlas de forma segura.

---

### Archivos: almacenamiento local + Cloudinary opcional

La aplicación permite subir PDFs, audios e imágenes asociados a una visita.

Por defecto, los archivos se guardan localmente en `backend/uploads`. Esta decisión se tomó para que la demo pueda ejecutarse sin depender de servicios externos ni credenciales adicionales. De esta forma, cualquier persona puede clonar el repositorio, levantar Docker y probar el flujo completo.

También se ha dejado soporte opcional para Cloudinary. La idea es que, si se configuran sus credenciales, los archivos puedan almacenarse en la nube sin cambiar el funcionamiento principal.

---

### IA: OpenAI API + fallback local

La IA se utiliza principalmente en dos puntos:

- generación del borrador de informe a partir de la información del proyecto, visitas, documentos, notas, imágenes y plantilla seleccionada;
- transcripción automática de audios.

He elegido OpenAI porque el requisito más importante de la prueba era que la IA respetase la estructura definida por una plantilla. Para ello, el backend construye un contexto estructurado con toda la información disponible y lo envía junto con las instrucciones de la plantilla.

La plantilla actúa como sistema de instrucciones: define secciones, tono, estilo y campos obligatorios. El objetivo es que el informe generado no sea simplemente un texto libre, sino un borrador adaptado al formato que necesita cada cliente.

También he añadido un fallback local para que la aplicación siga siendo demostrable aunque no se configure una `OPENAI_API_KEY`. En ese caso, el sistema genera un informe básico con los datos disponibles. No sustituye a la IA, pero permite comprobar el flujo completo de la plataforma sin depender de claves externas.

---

### Exportación: HTML y PDF

El informe generado se guarda como HTML porque es un formato flexible, fácil de visualizar en navegador y adecuado para representar secciones, tablas, imágenes y contenido enriquecido.

Además, se permite exportar el informe como PDF. Para esto he usado ReportLab desde el backend, evitando depender de herramientas externas. La idea era mantener el entorno Docker lo más simple posible.

---

### Docker Compose

He utilizado Docker Compose para facilitar la instalación y ejecución del proyecto. Con un único comando se levantan los tres servicios principales:

- PostgreSQL;
- backend FastAPI;
- frontend Next.js.

Esto reduce problemas de configuración local.

---

## Modelo de datos

El modelo de datos se ha organizado alrededor de las entidades principales del dominio:

- `User`: usuario autenticado de la plataforma.
- `Project`: proyecto con nombre, cliente, descripción y propietario.
- `Visit`: visita asociada a un proyecto, con fecha, notas y transcripción.
- `UploadAsset`: archivos asociados a una visita, incluyendo PDFs, audios e imágenes.
- `ReportTemplate`: plantilla de informe con estructura, instrucciones, tono y campos obligatorios.
- `Report`: informe generado, plantilla utilizada, HTML final y datos de trazabilidad.

Esta estructura permite separar la información recogida en campo, la plantilla usada para generar el informe y el resultado final generado.

---

## Plantillas como instrucciones para la IA

Las plantillas son una parte central de la aplicación.

Cada plantilla define:

- secciones del informe;
- orden de aparición;
- instrucciones específicas por sección;
- tono y estilo global;
- campos obligatorios.

Cuando se genera un informe, el backend recopila la información del proyecto, las visitas, las notas de texto, el texto extraído de PDFs, las transcripciones de audio y las imágenes adjuntas.

Con todo ello se construye un contexto para la IA. El prompt indica expresamente que debe respetar la estructura de la plantilla y devolver un borrador en HTML adaptado a ese formato.

Este diseño permite que un mismo conjunto de visitas pueda generar informes distintos según el cliente o el tipo de plantilla seleccionada.

---

## Seed demo

Se ha incluido un seed inicial para facilitar la revisión de la prueba. Con `SEED_DEMO_DATA=true`, la aplicación crea automáticamente:

- un usuario demo;
- proyectos de ejemplo;
- visitas;
- plantillas;
- archivos demo;
- informes iniciales.

Esto permite probar la aplicación nada más arrancarla, sin tener que introducir todos los datos manualmente desde cero.

Usuario demo:

```text
email: demo@agforest.local
password: demo123