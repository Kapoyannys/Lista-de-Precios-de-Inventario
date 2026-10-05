// Elements
const uploadSection = document.getElementById('upload-section');
const dataSection = document.getElementById('data-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');
const resetBtn = document.getElementById('reset-btn');
const tableBody = document.getElementById('table-body');
const printTableBody = document.getElementById('print-table-body');
const pageInfo = document.getElementById('page-info');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Price Elements & Configuration
const initialPriceSelect = document.getElementById('initial-price-select');
const priceSelect = document.getElementById('price-select');
const tablePriceHeader = document.getElementById('table-price-header');
const printPriceHeader = document.getElementById('print-price-header');
const printPriceTitle = document.getElementById('print-price-title');

const PRICE_CONFIG = {
    'H': { label: 'PRECIO 1', col: 'H', fullLabel: 'PRECIO 1 (Columna H)' },
    'I': { label: 'PRECIO 2', col: 'I', fullLabel: 'PRECIO 2 (Columna I)' },
    'K': { label: 'PRECIO 3', col: 'K', fullLabel: 'PRECIO 3 (Columna K)' },
    'M': { label: 'PRECIO 4', col: 'M', fullLabel: 'PRECIO 4 (Columna M)' }
};

// State
let globalData = [];
let filteredData = [];
let currentPage = 1;
let currentPriceKey = 'H';
let uploadedFileRef = null;
let searchDebounceTimer = null;
const rowsPerPage = 50;

// Inicializar Contador de Visitas en Header
const visitCounterEl = document.getElementById('visit-counter');
if (typeof Bitacora !== 'undefined') {
    const totalVisits = Bitacora.incrementVisits();
    if (visitCounterEl) {
        visitCounterEl.textContent = totalVisits.toLocaleString('es-MX');
    }
    Bitacora.addAction('Visita a la Aplicación', 'Ingreso del usuario a la página principal.');
}

// Format Price
const formatPrice = (value) => {
    if (value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(num);
};

// Helper to get selected price from item
const getCurrentPrice = (item) => {
    if (!item || !item.prices) return 0;
    return item.prices[currentPriceKey] ?? 0;
};

// Update price headers and titles
function updatePriceLabels() {
    const config = PRICE_CONFIG[currentPriceKey] || { label: 'PRECIO 1' };
    if (tablePriceHeader) tablePriceHeader.textContent = config.label;
    if (printPriceHeader) printPriceHeader.textContent = config.label;
    if (printPriceTitle) printPriceTitle.textContent = `LISTA DE PRECIOS - ${config.label}`;
}

// Combobox event listeners
if (initialPriceSelect) {
    initialPriceSelect.addEventListener('change', (e) => {
        currentPriceKey = e.target.value;
        if (priceSelect) priceSelect.value = currentPriceKey;
        updatePriceLabels();
    });
}

if (priceSelect) {
    priceSelect.addEventListener('change', (e) => {
        currentPriceKey = e.target.value;
        if (initialPriceSelect) initialPriceSelect.value = currentPriceKey;
        updatePriceLabels();
        renderTable();
        if (typeof Bitacora !== 'undefined') {
            const label = PRICE_CONFIG[currentPriceKey]?.label || currentPriceKey;
            Bitacora.addAction('Cambio de Precio', `Visualizando ${label} en la tabla.`);
        }
    });
}

// Handle Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Reset functionality
resetBtn.addEventListener('click', () => {
    uploadSection.classList.remove('hidden');
    dataSection.classList.add('hidden');
    fileInput.value = '';
    searchInput.value = '';
    globalData = [];
    filteredData = [];
    uploadedFileRef = null;
    currentPriceKey = 'H';
    if (priceSelect) priceSelect.value = 'H';
    if (initialPriceSelect) initialPriceSelect.value = 'H';
    updatePriceLabels();
    if (typeof Bitacora !== 'undefined') {
        Bitacora.addAction('Reinicio', 'Se limpió la pantalla para cargar otro archivo.');
    }
});

function showError(msg) {
    loadingIndicator.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function handleFile(file) {
    uploadedFileRef = file;
    if (!file.name.match(/\.(xls|xlsx)$/)) {
        showError('Por favor, selecciona un archivo Excel (.xls o .xlsx).');
        return;
    }

    errorMessage.classList.add('hidden');
    uploadArea.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Buscar "Sheet0" o usar la primera hoja si no existe
            const sheetName = workbook.SheetNames.includes('Sheet0') 
                ? 'Sheet0' 
                : workbook.SheetNames[0];
            
            const sheet = workbook.Sheets[sheetName];
            
            // Usar letras como keys para asegurar que C y H siempre son las columnas correctas
            const json = XLSX.utils.sheet_to_json(sheet, { header: "A", defval: "" });
            
            processData(json);
        } catch (err) {
            console.error(err);
            showError('Error al procesar el archivo. Asegúrate de que sea un Excel válido.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseNumericPrice(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[$,\s]/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
}

function processData(rows) {
    const extracted = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const desc = row.C;
        
        // Validar que la descripción no esté vacía y no sea un encabezado típico
        if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
            const descStr = String(desc).trim();
            const descLower = descStr.toLowerCase();
            
            // Evitar agregar encabezados de columna si los hay
            if (descLower !== 'descripción' && descLower !== 'descripcion' && descLower !== 'producto') {
                extracted.push({
                    desc: descStr,
                    prices: {
                        'H': parseNumericPrice(row.H),
                        'I': parseNumericPrice(row.I),
                        'K': parseNumericPrice(row.K),
                        'M': parseNumericPrice(row.M)
                    }
                });
            }
        }
    }
    
    if (extracted.length === 0) {
        showError('No se encontraron datos válidos en las columnas C, H, I, K y M. Revisa el formato del archivo.');
        return;
    }

    // Ordenar alfabéticamente por descripción
    extracted.sort((a, b) => a.desc.localeCompare(b.desc));

    globalData = extracted;
    filteredData = [...globalData];
    currentPage = 1;
    
    // Obtener la selección actual del combobox o usar 'H'
    if (initialPriceSelect && initialPriceSelect.value) {
        currentPriceKey = initialPriceSelect.value;
    }
    if (priceSelect) {
        priceSelect.value = currentPriceKey;
    }
    updatePriceLabels();

    // Registrar en Bitácora de Archivos Subidos
    if (typeof Bitacora !== 'undefined' && uploadedFileRef) {
        const initialPriceLabel = PRICE_CONFIG[currentPriceKey]?.label || 'PRECIO 1';
        Bitacora.addFileLog({
            fileName: uploadedFileRef.name,
            fileSize: uploadedFileRef.size,
            productsCount: extracted.length,
            initialPrice: initialPriceLabel
        });
    }

    loadingIndicator.classList.add('hidden');
    uploadSection.classList.add('hidden');
    dataSection.classList.remove('hidden');
    
    renderTable();
}

// Search
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    if (query === '') {
        filteredData = [...globalData];
    } else {
        filteredData = globalData.filter(item => 
            item.desc.toLowerCase().includes(query)
        );
    }
    
    currentPage = 1;
    renderTable();

    // Registrar evento de búsqueda con debounce de 1.2s para evitar saturación
    clearTimeout(searchDebounceTimer);
    if (query.trim().length >= 2) {
        searchDebounceTimer = setTimeout(() => {
            if (typeof Bitacora !== 'undefined') {
                Bitacora.addAction('Búsqueda', `Búsqueda de "${query.trim()}" con ${filteredData.length} resultados.`);
            }
        }, 1200);
    }
});

// Pagination
btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

btnNext.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

function renderTable() {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    // Calcular índices
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
    
    // Limpiar tabla web
    tableBody.innerHTML = '';
    
    // Renderizar página actual
    const pageData = filteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="2" style="text-align:center; padding: 2rem;">No se encontraron resultados</td>`;
        tableBody.appendChild(tr);
    } else {
        pageData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.desc}</td>
                <td class="price-col"><span class="price-tag">${formatPrice(getCurrentPrice(item))}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    // Actualizar info paginación
    pageInfo.textContent = `Mostrando ${totalItems > 0 ? startIndex + 1 : 0} - ${endIndex} de ${totalItems}`;
    
    // Controles paginación
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages || totalPages === 0;
}

// Optimización: Preparar tabla de impresión justo antes de imprimir
window.addEventListener('beforeprint', () => {
    const printTableBody = document.getElementById('print-table-body');
    if (!printTableBody) return;
    printTableBody.innerHTML = '';
    
    updatePriceLabels();
    
    // Para la impresión se renderizan TODOS los datos filtrados actuales de forma continua
    filteredData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.desc}</td>
            <td class="price-col">${formatPrice(getCurrentPrice(item))}</td>
        `;
        printTableBody.appendChild(tr);
    });

    if (typeof Bitacora !== 'undefined') {
        const priceLabel = PRICE_CONFIG[currentPriceKey]?.label || 'PRECIO 1';
        Bitacora.addAction('Impresión PDF', `Se preparó vista para imprimir ${filteredData.length} productos (${priceLabel}).`);
    }
});

window.addEventListener('afterprint', () => {
    // Limpiar DOM de impresión para ahorrar memoria
    const printTableBody = document.getElementById('print-table-body');
    if (printTableBody) printTableBody.innerHTML = '';
});

// Exportar a Excel
const exportExcelBtn = document.getElementById('export-excel-btn');
if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
        if (filteredData.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const priceLabel = PRICE_CONFIG[currentPriceKey]?.label || 'PRECIO 1';

        // Crear la estructura de arreglos (AOA) para incluir el membrete
        const aoa = [
            ["BODEGAS PUMPO"],
            [`LISTA DE PRECIOS - ${priceLabel}`],
            [], // Fila en blanco como separador
            ["Descripción del Producto", priceLabel] // Encabezados de tabla
        ];

        // Llenar con los datos filtrados
        filteredData.forEach(item => {
            aoa.push([item.desc, getCurrentPrice(item)]);
        });

        // Crear hoja y libro
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Precios");

        // Combinar celdas para el membrete (A1:B1 y A2:B2)
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
        ];

        // Ajustar ancho de las columnas
        worksheet['!cols'] = [
            { wch: 50 }, // Ancho para Descripción
            { wch: 15 }  // Ancho para Precio
        ];

        // Descargar archivo con nombre que identifique el precio seleccionado
        const safeLabel = priceLabel.replace(/\s+/g, '_');
        const exportFileName = `Lista_de_Precios_Pumpo_${safeLabel}.xlsx`;
        XLSX.writeFile(workbook, exportFileName);

        if (typeof Bitacora !== 'undefined') {
            Bitacora.addAction('Exportación Excel', `Se descargó '${exportFileName}' con ${filteredData.length} productos.`);
        }
    });
}
