const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const XLSX = require('xlsx');
const { PASSWORD } = require('../../scripts/demo-data');

async function login(page, identifier, password = PASSWORD) {
    await page.goto('/');
    await page.getByLabel('Email o Matrícula').fill(identifier);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}
async function capture(page, file) {
    if (process.env.CAPTURE_DOCS !== '1') return;
    const folder = path.join(__dirname, '../../docs/screenshots');
    await fs.mkdir(folder, { recursive: true });
    await page.screenshot({ path: path.join(folder, file), fullPage: true });
}
test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    page.on('pageerror', (error) => {
        throw error;
    });
});

test('login: error visible sin recargar ni perder el formulario', async ({ page }) => {
    await page.goto('/');
    await capture(page, 'login.png');
    await login(page, 'docente@example.test', 'incorrecta');
    await expect(page.getByRole('alert')).toContainText('incorrectos');
    await expect(page.getByLabel('Email o Matrícula')).toHaveValue('docente@example.test');
});

test('docente: captura, persistencia tras recargar, reportes y archivos exportados', async ({
    page,
}) => {
    await login(page, 'docente@example.test');
    await expect(
        page.getByRole('heading', { name: 'Ingeniería de Software', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Cargando datos...', { exact: true })).toHaveCount(0);
    await capture(page, 'docente-resumen.png');
    await page.getByRole('button', { name: 'Pasar Lista', exact: true }).click();
    await expect(
        page.getByRole('button', { name: 'Falta: Lucía Torres', exact: true }),
    ).toBeVisible();
    const date = await page.getByLabel('Fecha de asistencia').inputValue();
    await expect(page.getByText('Cargando datos...', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Falta: Lucía Torres', exact: true }).click();
    await page.getByRole('button', { name: 'Retardo: Mateo Ríos', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('status')).toContainText('Asistencia guardada correctamente');
    await capture(page, 'asistencia.png');
    await page.reload();
    await page.getByRole('button', { name: 'Pasar Lista', exact: true }).click();
    await page.getByLabel('Fecha de asistencia').fill(date);
    await expect(
        page.getByRole('button', { name: 'Falta: Lucía Torres', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Reportes', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await capture(page, 'reportes.png');
    const pdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF', exact: true }).click();
    const pdf = await fs.readFile(await (await pdfDownload).path());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const excelDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Excel', exact: true }).click();
    const workbook = XLSX.read(await fs.readFile(await (await excelDownload).path()));
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Reporte);
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.Alumno)).toContain('Lucía Torres');
    await page.getByRole('button', { name: 'Cerrar Sesión', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
});

test('alumno: historial propio y cambio de contraseña utilizable al volver a entrar', async ({
    page,
}) => {
    await login(page, 'DEMO-1');
    await expect(page.getByRole('heading', { name: 'Mi Asistencia' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.getByText('Mateo Ríos')).toHaveCount(0);
    await capture(page, 'alumno.png');
    await page.getByRole('button', { name: 'Contraseña', exact: true }).click();
    await page.getByLabel('Contraseña Actual').fill(PASSWORD);
    await page.getByLabel('Nueva Contraseña').fill('AlumnoNueva2026!');
    await page.getByLabel('Confirmar Nueva').fill('AlumnoNueva2026!');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cambiar Contraseña' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await login(page, 'DEMO-1', 'AlumnoNueva2026!');
    await expect(page.getByRole('heading', { name: 'Mi Asistencia' })).toBeVisible();
});

test('administración: altas, edición, rechazo de eliminación con referencias y estados vacíos', async ({
    page,
}) => {
    await login(page, 'admin@example.test');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await capture(page, 'admin.png');
    await page.getByRole('button', { name: 'Eliminar Elena Rivera' }).click();
    await expect(page.getByRole('alert')).toContainText('Reasigna los grupos');
    await page.getByRole('button', { name: 'Nuevo', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Docente sin grupos');
    await page.getByLabel('Email', { exact: true }).fill('empty@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await page.getByRole('button', { name: 'Editar Docente sin grupos' }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Docente sin asignación');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Editar Docente sin asignación' })).toBeVisible();
    await page.getByRole('button', { name: 'Alumnos', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(6);
    await page.getByRole('button', { name: 'Nuevo', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Alumno sin historial');
    await page.getByLabel('Matrícula', { exact: true }).fill('EMPTY-1');
    await page
        .getByLabel('Grupo', { exact: true })
        .selectOption({ label: 'DEMO-A (Ingeniería de Software)' });
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(7);
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await login(page, 'EMPTY-1');
    await expect(
        page.getByText('Aún no hay asistencias registradas.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await login(page, 'empty@example.test');
    await expect(page.getByText('Aún no tienes grupos asignados.', { exact: false })).toBeVisible();
});

test('docente en móvil: navegación y cierre de sesión disponibles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, 'docente2@example.test');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
    await page.getByRole('button', { name: 'Pasar Lista', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Presente: Diego Sol' })).toBeVisible();
    await capture(page, 'docente-movil.png');
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
});

test('interfaz: búsqueda del directorio y formulario accesible con Escape', async ({ page }) => {
    await login(page, 'admin@example.test');
    await expect(page.getByRole('button', { name: 'Editar Elena Rivera' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Buscar docentes' }).fill('Elena');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page
        .getByRole('searchbox', { name: 'Buscar docentes' })
        .fill('Sin coincidencias para esta cuenta');
    await expect(page.getByText('Sin coincidencias', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Nuevo docente' })).toBeVisible();
    await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Nuevo', exact: true })).toBeFocused();
});

test('interfaz móvil: login y directorio administrativo sin desbordar la página', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByLabel('Contraseña', { exact: true }).fill('SoloUnaPrueba');
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
        'type',
        'password',
    );
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await login(page, 'admin@example.test');
    await expect(page.getByRole('heading', { name: 'Directorio de docentes' })).toBeVisible();
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden();
});
