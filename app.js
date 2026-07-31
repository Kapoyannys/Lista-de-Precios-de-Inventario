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

// State
let globalData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 50;

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
});

function showError(msg) {
    loadingIndicator.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function handleFile(file) {
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

function processData(rows) {
    const extracted = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const desc = row.C;
        let price = row.H;
        
        // Validar que la descripción no esté vacía y no sea un encabezado típico
        if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
            const descStr = String(desc).trim();
            
            // Si el precio viene con formato erróneo (ej. 199.000000 o texto), lo convertimos a número
            let parsedPrice = parseFloat(String(price));
            if (isNaN(parsedPrice)) {
                parsedPrice = 0;
            }
            
            // Evitar agregar encabezados de columna si los hay
            if (descStr.toLowerCase() !== 'descripción' && descStr.toLowerCase() !== 'descripcion' && descStr.toLowerCase() !== 'producto') {
                extracted.push({
                    desc: descStr,
                    price: parsedPrice
                });
            }
        }
    }
    
    if (extracted.length === 0) {
        showError('No se encontraron datos válidos en las columnas C y H. Revisa el formato del archivo.');
        return;
    }

    // Ordenar alfabéticamente por descripción
    extracted.sort((a, b) => a.desc.localeCompare(b.desc));

    globalData = extracted;
    filteredData = [...globalData];
    currentPage = 1;
    
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
                <td class="price-col">${formatPrice(item.price)}</td>
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
    
    // Para la impresión se renderizan TODOS los datos filtrados actuales de forma continua
    filteredData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.desc}</td>
            <td class="price-col">${formatPrice(item.price)}</td>
        `;
        printTableBody.appendChild(tr);
    });
});

window.addEventListener('afterprint', () => {
    // Limpiar DOM de impresión para ahorrar memoria
    const printTableBody = document.getElementById('print-table-body');
    if (printTableBody) printTableBody.innerHTML = '';
});

// Botones de PDF
const exportPdfFullBtn = document.getElementById('export-pdf-full-btn');
const exportPdfCompactBtn = document.getElementById('export-pdf-compact-btn');

if (exportPdfFullBtn) {
    exportPdfFullBtn.addEventListener('click', () => {
        document.body.classList.remove('print-compact');
        document.body.classList.add('print-full');
        window.print();
    });
}

if (exportPdfCompactBtn) {
    exportPdfCompactBtn.addEventListener('click', () => {
        document.body.classList.remove('print-full');
        document.body.classList.add('print-compact');
        window.print();
    });
}

// Exportar a Excel
const exportExcelBtn = document.getElementById('export-excel-btn');
if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
        if (filteredData.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        // Crear la estructura de arreglos (AOA) para incluir el membrete
        const aoa = [
            ["BODEGAS PUMPO"],
            ["LISTA DE PRECIOS"],
            [], // Fila en blanco como separador
            ["Descripción del Producto", "Precio"] // Encabezados de tabla
        ];

        // Llenar con los datos filtrados
        filteredData.forEach(item => {
            aoa.push([item.desc, item.price]);
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

        // Descargar archivo
        XLSX.writeFile(workbook, 'Lista_de_Precios_Pumpo.xlsx');
    });
}
