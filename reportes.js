/**
 * reportes.js
 * Lógica para la visualización de métricas, bitácora de archivos y auditoría de eventos.
 */

document.addEventListener('DOMContentLoaded', () => {
    // KPI Elements
    const kpiVisits = document.getElementById('kpi-visits');
    const kpiFiles = document.getElementById('kpi-files');
    const kpiFilesSub = document.getElementById('kpi-files-sub');
    const kpiActions = document.getElementById('kpi-actions');
    const kpiLastActivity = document.getElementById('kpi-last-activity');
    const kpiLastActionName = document.getElementById('kpi-last-action-name');

    // Badge Elements
    const filesBadgeCount = document.getElementById('files-badge-count');
    const actionsBadgeCount = document.getElementById('actions-badge-count');

    // Tab Elements
    const tabBtnFiles = document.getElementById('tab-btn-files');
    const tabBtnActions = document.getElementById('tab-btn-actions');
    const panelFiles = document.getElementById('panel-files');
    const panelActions = document.getElementById('panel-actions');
    const actionFilterBox = document.getElementById('action-filter-box');

    // Table & Control Elements
    const filesTableBody = document.getElementById('files-table-body');
    const actionsTableBody = document.getElementById('actions-table-body');
    const filesPageInfo = document.getElementById('files-page-info');
    const actionsPageInfo = document.getElementById('actions-page-info');
    const reportSearch = document.getElementById('report-search');
    const actionFilterSelect = document.getElementById('action-filter-select');
    const exportReportsBtn = document.getElementById('export-reports-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');

    // Current State
    let currentTab = 'files';
    let fileLogs = [];
    let actionLogs = [];

    // Helper: Map action to badge style
    function getActionBadge(action) {
        const lower = (action || '').toLowerCase();
        let badgeClass = 'badge-file';

        if (lower.includes('carga') || lower.includes('archivo')) {
            badgeClass = 'badge-file';
        } else if (lower.includes('precio')) {
            badgeClass = 'badge-price';
        } else if (lower.includes('búsqueda') || lower.includes('busqueda')) {
            badgeClass = 'badge-search';
        } else if (lower.includes('export') || lower.includes('excel')) {
            badgeClass = 'badge-export';
        } else if (lower.includes('impres') || lower.includes('pdf')) {
            badgeClass = 'badge-print';
        } else if (lower.includes('reinicio')) {
            badgeClass = 'badge-reset';
        } else if (lower.includes('visita')) {
            badgeClass = 'badge-visit';
        }

        return `<span class="action-badge ${badgeClass}">${action}</span>`;
    }

    // Load and update KPIs
    function refreshData() {
        if (typeof Bitacora === 'undefined') return;

        fileLogs = Bitacora.getFileLogs();
        actionLogs = Bitacora.getActionLogs();
        const visits = Bitacora.getVisits();

        // Update KPIs
        if (kpiVisits) kpiVisits.textContent = visits.toLocaleString('es-MX');
        if (kpiFiles) kpiFiles.textContent = fileLogs.length.toLocaleString('es-MX');
        if (kpiActions) kpiActions.textContent = actionLogs.length.toLocaleString('es-MX');

        // Total products processed across all files
        const totalProducts = fileLogs.reduce((acc, curr) => acc + (curr.productsCount || 0), 0);
        if (kpiFilesSub) {
            kpiFilesSub.textContent = `${totalProducts.toLocaleString('es-MX')} productos cargados`;
        }

        // Last activity
        if (actionLogs.length > 0) {
            const last = actionLogs[0];
            if (kpiLastActivity) kpiLastActivity.textContent = last.timestamp.split(' ')[1] + ' ' + (last.timestamp.split(' ')[2] || '');
            if (kpiLastActionName) kpiLastActionName.textContent = `${last.action}: ${last.details.substring(0, 32)}...`;
        } else {
            if (kpiLastActivity) kpiLastActivity.textContent = '--';
            if (kpiLastActionName) kpiLastActionName.textContent = 'Sin actividad registrada';
        }

        // Badges
        if (filesBadgeCount) filesBadgeCount.textContent = fileLogs.length;
        if (actionsBadgeCount) actionsBadgeCount.textContent = actionLogs.length;

        renderFilesTable();
        renderActionsTable();
    }

    // Render Files Table
    function renderFilesTable() {
        if (!filesTableBody) return;
        const query = (reportSearch ? reportSearch.value : '').toLowerCase().trim();

        const filtered = fileLogs.filter(item => {
            if (!query) return true;
            return item.fileName.toLowerCase().includes(query) ||
                   item.timestamp.toLowerCase().includes(query) ||
                   (item.initialPrice && item.initialPrice.toLowerCase().includes(query));
        });

        filesTableBody.innerHTML = '';

        if (filtered.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                ${fileLogs.length === 0 ? 'No se ha subido ningún archivo Excel todavía.' : 'No se encontraron archivos con ese criterio de búsqueda.'}
            </td>`;
            filesTableBody.appendChild(tr);
        } else {
            filtered.forEach((log, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="color: var(--text-secondary); font-weight: 600;">${filtered.length - index}</td>
                    <td style="font-weight: 600; color: var(--text-primary);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span>${log.fileName}</span>
                        </div>
                    </td>
                    <td style="color: var(--text-secondary); font-family: monospace;">${log.fileSize}</td>
                    <td style="text-align: right; font-weight: 600; color: #34d399;">${(log.productsCount || 0).toLocaleString('es-MX')}</td>
                    <td><span class="action-badge badge-price">${log.initialPrice || 'PRECIO 1'}</span></td>
                    <td style="color: var(--text-secondary); font-size: 0.9rem;">${log.timestamp}</td>
                `;
                filesTableBody.appendChild(tr);
            });
        }

        if (filesPageInfo) {
            filesPageInfo.textContent = `Mostrando ${filtered.length} de ${fileLogs.length} archivo(s)`;
        }
    }

    // Render Actions Table
    function renderActionsTable() {
        if (!actionsTableBody) return;
        const query = (reportSearch ? reportSearch.value : '').toLowerCase().trim();
        const actionFilter = actionFilterSelect ? actionFilterSelect.value : 'ALL';

        const filtered = actionLogs.filter(item => {
            // Filter by type
            if (actionFilter !== 'ALL') {
                if (!item.action.toLowerCase().includes(actionFilter.toLowerCase())) {
                    return false;
                }
            }
            // Filter by query
            if (!query) return true;
            return item.action.toLowerCase().includes(query) ||
                   item.details.toLowerCase().includes(query) ||
                   item.timestamp.toLowerCase().includes(query);
        });

        actionsTableBody.innerHTML = '';

        if (filtered.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                ${actionLogs.length === 0 ? 'No hay acciones registradas en la bitácora.' : 'No se encontraron acciones con ese filtro o búsqueda.'}
            </td>`;
            actionsTableBody.appendChild(tr);
        } else {
            filtered.forEach((log, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="color: var(--text-secondary); font-weight: 600;">${filtered.length - index}</td>
                    <td>${getActionBadge(log.action)}</td>
                    <td style="color: var(--text-primary); font-size: 0.92rem;">${log.details}</td>
                    <td style="color: var(--text-secondary); font-size: 0.88rem; font-family: monospace;">${log.timestamp}</td>
                `;
                actionsTableBody.appendChild(tr);
            });
        }

        if (actionsPageInfo) {
            actionsPageInfo.textContent = `Mostrando ${filtered.length} de ${actionLogs.length} acción(es) registrada(s)`;
        }
    }

    // Switch Tabs
    window.switchTab = (tab) => {
        currentTab = tab;
        if (tab === 'files') {
            tabBtnFiles.classList.add('active');
            tabBtnActions.classList.remove('active');
            panelFiles.classList.remove('hidden');
            panelActions.classList.add('hidden');
            if (actionFilterBox) actionFilterBox.classList.add('hidden');
            renderFilesTable();
        } else {
            tabBtnActions.classList.add('active');
            tabBtnFiles.classList.remove('active');
            panelActions.classList.remove('hidden');
            panelFiles.classList.add('hidden');
            if (actionFilterBox) actionFilterBox.classList.remove('hidden');
            renderActionsTable();
        }
    };

    // Filter Listeners
    if (reportSearch) {
        reportSearch.addEventListener('input', () => {
            if (currentTab === 'files') {
                renderFilesTable();
            } else {
                renderActionsTable();
            }
        });
    }

    if (actionFilterSelect) {
        actionFilterSelect.addEventListener('change', () => {
            renderActionsTable();
        });
    }

    // Export Bitácora to Excel
    if (exportReportsBtn) {
        exportReportsBtn.addEventListener('click', () => {
            if (typeof XLSX === 'undefined') {
                alert('La librería SheetJS no está cargada.');
                return;
            }

            if (fileLogs.length === 0 && actionLogs.length === 0) {
                alert('No hay registros en la bitácora para exportar.');
                return;
            }

            const workbook = XLSX.utils.book_new();

            // Hoja 1: Bitácora de Archivos
            const filesAoa = [
                ["BODEGAS PUMPO - BITÁCORA DE ARCHIVOS SUBIDOS"],
                [`Fecha de Exportación: ${Bitacora.formatTimestamp()}`],
                [],
                ["#", "Nombre del Archivo", "Tamaño", "Productos Leídos", "Precio Inicial", "Fecha y Hora de Carga"]
            ];

            fileLogs.forEach((f, idx) => {
                filesAoa.push([
                    fileLogs.length - idx,
                    f.fileName,
                    f.fileSize,
                    f.productsCount,
                    f.initialPrice || 'PRECIO 1',
                    f.timestamp
                ]);
            });

            const filesWs = XLSX.utils.aoa_to_sheet(filesAoa);
            filesWs['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
            ];
            filesWs['!cols'] = [
                { wch: 6 },
                { wch: 35 },
                { wch: 15 },
                { wch: 18 },
                { wch: 16 },
                { wch: 24 }
            ];
            XLSX.utils.book_append_sheet(workbook, filesWs, "Archivos Subidos");

            // Hoja 2: Historial de Acciones
            const actionsAoa = [
                ["BODEGAS PUMPO - HISTORIAL DE AUDITORÍA Y ACCIONES"],
                [`Total Visitas al Sistema: ${Bitacora.getVisits()}`],
                [],
                ["#", "Tipo de Acción", "Detalles del Evento", "Fecha y Hora"]
            ];

            actionLogs.forEach((a, idx) => {
                actionsAoa.push([
                    actionLogs.length - idx,
                    a.action,
                    a.details,
                    a.timestamp
                ]);
            });

            const actionsWs = XLSX.utils.aoa_to_sheet(actionsAoa);
            actionsWs['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
            ];
            actionsWs['!cols'] = [
                { wch: 6 },
                { wch: 22 },
                { wch: 60 },
                { wch: 24 }
            ];
            XLSX.utils.book_append_sheet(workbook, actionsWs, "Auditoría de Acciones");

            // Descargar libro
            const now = new Date();
            const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
            XLSX.writeFile(workbook, `Bitacora_Bodegas_Pumpo_${dateStr}.xlsx`);
        });
    }

    // Clear Bitácora
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            const confirmed = confirm('¿Estás seguro de que deseas vaciar toda la bitácora y reiniciar el contador de visitas?\n\nEsta acción eliminará el historial de archivos subidos y auditoría de acciones.');
            if (confirmed) {
                Bitacora.clearAll();
                refreshData();
                alert('La bitácora y el contador de visitas han sido restablecidos exitosamente.');
            }
        });
    }

    // Initialize
    refreshData();
});
