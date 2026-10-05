/**
 * bitacora.js
 * Módulo de Auditoría, Bitácora y Contador de Visitas para Bodegas Pumpo.
 * Almacena información de forma persistente y local mediante localStorage.
 */
const Bitacora = (() => {
    const STORAGE_KEYS = {
        VISITS: 'pumpo_visits',
        FILES: 'pumpo_file_logs',
        ACTIONS: 'pumpo_action_logs'
    };

    // Helper para formatear fecha y hora
    const formatTimestamp = (d = new Date()) => {
        const pad = (n) => String(n).padStart(2, '0');
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // '0' se convierte en '12'
        return `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    };

    // Helper para formatear tamaño de bytes a unidad legible
    const formatBytes = (bytes) => {
        if (!bytes || isNaN(bytes) || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // --- CONTADOR DE VISITAS ---
    const getVisits = () => {
        return parseInt(localStorage.getItem(STORAGE_KEYS.VISITS) || '0', 10);
    };

    const incrementVisits = () => {
        const current = getVisits() + 1;
        localStorage.setItem(STORAGE_KEYS.VISITS, current);
        return current;
    };

    // --- BITÁCORA DE ARCHIVOS SUBIDOS ---
    const getFileLogs = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
        } catch (e) {
            console.error('Error al leer bitácora de archivos:', e);
            return [];
        }
    };

    const addFileLog = ({ fileName, fileSize, productsCount, initialPrice }) => {
        const logs = getFileLogs();
        const newLog = {
            id: logs.length + 1,
            fileName: fileName || 'archivo_desconocido.xls',
            fileSize: typeof fileSize === 'number' ? formatBytes(fileSize) : (fileSize || 'Desconocido'),
            productsCount: productsCount || 0,
            initialPrice: initialPrice || 'PRECIO 1',
            timestamp: formatTimestamp()
        };
        logs.unshift(newLog); // El más reciente al inicio
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(logs));
        
        // Registrar también en el historial de acciones
        const countFormatted = newLog.productsCount.toLocaleString('es-MX');
        addAction('Carga de Archivo', `Se procesó '${newLog.fileName}' (${newLog.fileSize}) con ${countFormatted} productos (${newLog.initialPrice}).`);
        return newLog;
    };

    // --- HISTORIAL Y AUDITORÍA DE ACCIONES ---
    const getActionLogs = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIONS) || '[]');
        } catch (e) {
            console.error('Error al leer historial de acciones:', e);
            return [];
        }
    };

    const addAction = (action, details) => {
        const actions = getActionLogs();
        const newAction = {
            id: actions.length + 1,
            action: action,
            details: details || '',
            timestamp: formatTimestamp()
        };
        actions.unshift(newAction); // El más reciente al inicio
        // Limitar a los últimos 500 registros para evitar sobrecarga de localStorage
        if (actions.length > 500) {
            actions.pop();
        }
        localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actions));
        return newAction;
    };

    // --- LIMPIEZA Y REINICIO ---
    const clearAll = () => {
        localStorage.removeItem(STORAGE_KEYS.VISITS);
        localStorage.removeItem(STORAGE_KEYS.FILES);
        localStorage.removeItem(STORAGE_KEYS.ACTIONS);
    };

    return {
        getVisits,
        incrementVisits,
        getFileLogs,
        addFileLog,
        getActionLogs,
        addAction,
        clearAll,
        formatTimestamp,
        formatBytes
    };
})();

// Compatibilidad global (Browser y Node)
if (typeof window !== 'undefined') {
    window.Bitacora = Bitacora;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Bitacora;
}
