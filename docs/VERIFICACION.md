# Evidencia de verificación

Preparación realizada el **7 de noviembre de 2026**, en WSL/Linux, con Node.js **22.22.1**, npm **9.2.0**, MongoDB **8.0.16**, Playwright **1.61.0** y Chrome for Testing **156.0.8078.4** (Chromium) disponible en el entorno. Se usó el ejecutable existente, en lugar de descargar el predeterminado de Playwright. No se conectó una base con datos reales.

## Actualización de interfaz — 9 de noviembre de 2026

Se renovaron el login, la navegación compartida, los paneles de los tres roles y los formularios. Se conservaron el backend, la configuración, el lockfile y las restricciones de acceso. La interfaz usa la paleta azul sobrio y académico elegida por el autor, sin añadir dependencias al proyecto.

Se volvieron a ejecutar las **20 pruebas de API/configuración**, el build y **7 escenarios de navegador** sobre el estado rediseñado. Se regeneraron **7 capturas reales**, incluida la vista móvil. La revisión visual se hizo abriendo las imágenes generadas.

Las pruebas nuevas comprueban la búsqueda en directorios, el foco inicial de formularios, el cierre con Escape y la devolución del foco, la visibilidad de contraseñas y la ausencia de desbordamiento horizontal de la página en un viewport de 390 × 844. Durante la verificación se corrigió la devolución del foco al cerrar un formulario.

Los commits locales se crearon después de recibir autorización el 9 de noviembre. No se hizo push ni se configuró un remoto. El análisis de dependencias de la preparación anterior no se volvió a ejecutar para este cambio de interfaz; sus dependencias no cambiaron.

## Ajuste de textos — 9 de noviembre de 2026

Se retiraron los lemas de la barra lateral, el login y los paneles. Se sustituyeron por nombres de funciones y estados, como «Control de asistencia», «Corrección de asistencias» y «Sin registros». Se conserva la distribución visual y se eliminan los estilos de los bloques retirados.

Para esta corrección de textos y CSS se ejecutaron el build y los **7 escenarios de navegador**, todos aprobados, y se regeneraron las siete capturas. Se revisaron visualmente el login y el resumen docente. No se repitieron las pruebas de API/configuración porque no hubo cambios en el backend. La licencia no cambió.

## Reorganización del historial — 9 de noviembre de 2026

Con autorización del autor se reorganizaron los cambios reales en commits técnicos. Se conservaron la copia académica inicial y la rama de respaldo `backup/historial-previo-a-reorganizacion`. La nueva secuencia se creó en un worktree separado y no se presentó como un historial registrado durante el desarrollo original.

| Etapa reorganizada | Comprobación realizada |
| --- | --- |
| Importación académica saneada | Sintaxis del servidor/backend y revisión de exclusiones; esta base conserva defectos corregidos después |
| Configuración e instalación | 2 pruebas de configuración y build |
| Autenticación, roles y pertenencia | 13 pruebas, incluidos casos permitidos y rechazados |
| Captura y corrección de asistencia | 18 pruebas |
| Preparación de la demo | 20 pruebas |
| Separación de paneles y flujos | Build y 5 escenarios de navegador |
| Interfaz final y textos funcionales | Build y 7 escenarios de navegador |
| Documentación y capturas | Enlaces locales y comparación exacta con los archivos anteriores |

No se modificó la lógica de la aplicación al reorganizar el historial. Se comprobó que el código, configuración, pruebas, lockfile y capturas finales coinciden con la versión previa; solo se actualizó la documentación del historial. No se volvió a ejecutar Docker, GitHub Actions ni la auditoría de dependencias para esta reorganización.

## Publicación y verificación en GitHub — 10 de noviembre de 2026

El repositorio público es [DAVEst21/asiste](https://github.com/DAVEst21/asiste). Se publicó únicamente la rama `main`; el respaldo del historial permanece local. GitHub reconoció la licencia ISC y se comprobaron el README, el archivo de licencia y las capturas principales publicados.

Antes de subir el código se ejecutaron nuevamente **20 pruebas de API/configuración**, el build, **7 escenarios de navegador** y `npm audit`, que reportó **0 vulnerabilidades**. También se revisaron los nueve commits iniciales de `main` para detectar archivos locales o patrones de secretos antes del push.

La [primera ejecución de GitHub Actions](https://github.com/DAVEst21/asiste/actions/runs/42946757939), correspondiente al commit `032544a`, terminó con resultado **success**. Completó la instalación con `npm ci`, las pruebas y el build, la auditoría de dependencias, la instalación de Chromium y las pruebas de navegador. Es una comprobación real en GitHub, independiente del entorno WSL local.

El estado de ejecuciones posteriores se consulta en [Actions](https://github.com/DAVEst21/asiste/actions). El código publicado no implica un despliegue de la aplicación.

## Estado comprobado

| Nivel | Evidencia |
| --- | --- |
| Código inspeccionado | Rutas, middleware, controladores, modelos, configuración, generación de datos y paneles React. Se revisaron los cambios frente a una copia local del estado académico. |
| API y configuración automatizadas | **20 pruebas aprobadas**, ejecutadas por `node:test` contra HTTP y un `mongod` aislado. |
| Navegador automatizado | **7 escenarios aprobados** en Chromium: login fallido, flujo docente, flujo alumno, administración, navegación móvil, búsquedas/formularios y acceso/directorio en móvil. Sin mocks de la API ni de MongoDB. |
| Instalación y build | Instalación limpia desde `package-lock.json` y build de producción completados. |
| Arranque con configuración | `server.js` inició usando `MONGO_URI`, `JWT_SECRET` y `PORT`; `/api/health`, login y entrega del HTML del build respondieron correctamente. |
| Seeder por CLI | Dos ejecuciones sobre MongoDB temporal llamado `asiste_demo`: la primera agregó fixtures y la segunda agregó cero cuentas/grupos. Las pruebas comprueban conservación de cuentas, hashes y capturas. |
| Inspección visual manual | Se abrieron las capturas reales del login, resumen docente, captura de asistencia, reporte, alumno, administración y captura móvil. No son maquetas. |
| Dependencias | La ejecución local de `npm audit` del 10 de noviembre reportó **0 vulnerabilidades**. Este resultado corresponde al lockfile actual y al catálogo de avisos consultado en esa ejecución. |

El recorrido interactivo se automatizó con Playwright; no se presenta como una sesión manual en un navegador con ventana. La revisión manual corresponde a código, diferencias y capturas.

## Qué prueban los escenarios

- Login de administración, docentes y alumnos; rechazo de credenciales incorrectas y objetos enviados como identificador.
- Registro público rechazado con y sin un rol privilegiado; el número de cuentas no aumenta.
- Tokens ausentes, inválidos, expirados, con otra firma o asociados a cuentas inexistentes. Un cambio de rol en BD invalida los privilegios del token anterior.
- Rutas administrativas permitidas al administrador y rechazadas a docentes/alumnos.
- Listado de grupos propio y rechazo al intentar leer o escribir en un grupo ajeno.
- Reporte del alumno limitado a su fila e historial, aunque envíe el ID de un compañero.
- Captura de presentes, retardos y faltas; corrección sin duplicados, filtro de fechas y cálculo del reporte.
- Rechazo de lotes vacíos, alumnos repetidos, estados desconocidos, fechas inexistentes y alumnos de otro grupo antes de escribir.
- Conservación de observaciones al omitirlas en una corrección. Canonicalización de IDs para detectar duplicados escritos con diferente capitalización.
- CRUD administrativo y bloqueos que conservan referencias e historial. Los hashes no salen en las respuestas ni se recalculan al cambiar únicamente el nombre.
- Cambio de contraseña con validación de la contraseña actual, longitud y separación entre alumnos.
- Repetición del seeder sin reinicios, detección de colisiones y rechazo de otra base.
- Persistencia de la captura al recargar el navegador, descarga de un PDF con encabezado válido y lectura de las filas del archivo XLSX generado.
- Alta/edición desde administración, rechazo de eliminación con referencias, alumno sin historial y docente sin asignaciones.
- Navegación docente y cierre de sesión con viewport móvil de 390 × 844. Es emulación de tamaño, no prueba en un teléfono físico.

## Reproducir

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm audit
```

Para regenerar las siete capturas, construye primero el frontend y ejecuta:

```bash
CAPTURE_DOCS=1 npm run test:e2e
```

Las imágenes se guardan en `docs/screenshots`. Los resultados y trazas de fallos quedan en `test-results`, excluido de Git. Las pruebas de navegador levantan su propia demo en `127.0.0.1:3100` y la detienen al terminar. El cierre gradual de Playwright permite retirar también el directorio temporal de MongoDB.

### Particularidades del entorno usado

Docker Desktop no tenía integración activa con esta distribución WSL. Se utilizó MongoDB temporal, no Docker.

Chromium ya estaba descargado, pero faltaban bibliotecas compartidas de Linux. Para verificar sin modificar el sistema, se extrajeron bibliotecas en `/tmp/asiste-browser-libs` y se apuntó al ejecutable disponible mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. La ejecución utilizó `LD_LIBRARY_PATH` únicamente en ese comando. No se instalaron SDK ni servicios del sistema.

La primera ejecución de MongoDB temporal descarga su binario a la caché del usuario. Se requiere internet y espacio libre; `/tmp` necesita espacio para la base y los índices. Una ejecución inicial detectó directorios residuales de pruebas; se limpiaron esos temporales y se incorporó cierre gradual. La comprobación final terminó sin procesos MongoDB ni directorios de base temporales residuales.

## Dependencias y alcance de cambios

Se conservó la arquitectura React/Express/MongoDB. Las únicas bibliotecas nuevas son de desarrollo: `mongodb-memory-server-core` para usar un MongoDB real aislado y `@playwright/test` para navegador y capturas. Se usa `node:test` en lugar de añadir otro framework de pruebas de API.

Se actualizaron dependencias heredadas con avisos de seguridad, incluyendo Express/Mongoose y las herramientas de exportación. Vite pasó a 7 con su plugin compatible para retirar avisos de desarrollo. El código de exportación se volvió a probar con jsPDF 4.

SheetJS se instala desde el tarball oficial **0.20.3**, fijado mediante URL e integridad en el lockfile, porque el paquete publicado como `xlsx` en el registro npm conserva una versión antigua. Referencia: [instalación oficial de SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). Para jsPDF se consultaron [sus avisos de seguridad](https://github.com/parallax/jsPDF/security/advisories).

## Licencia confirmada — 10 de noviembre de 2026

El autor confirmó que se conserve ISC. Se añadió el archivo `LICENSE` con su nombre y el año 2026, se enlazó desde el README y se retiró la licencia de los pendientes. Los metadatos de `package.json` y `package-lock.json` ya indicaban ISC y se conservaron. Se revisaron el texto contra la [plantilla ISC](https://choosealicense.com/licenses/isc/), la autoría y los enlaces locales; este cambio de licencia y documentación no modifica el código de la aplicación.

## Pendiente de verificar

- Ejecución de `compose.yaml`: no se levantó Docker en este WSL.
- Firefox, WebKit, dispositivos físicos, accesibilidad exhaustiva y pruebas de carga/concurrencia.
- Despliegue público con TLS, recuperación de contraseñas, limitación de intentos y revocación individual de sesiones.
