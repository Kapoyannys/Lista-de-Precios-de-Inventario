# Gestor de Lista de Precios - Bodegas Pumpo 🍷

Una aplicación web rápida, segura y completamente local (client-side) diseñada para cargar listas de inventario generadas en Excel, limpiarlas, visualizarlas y exportarlas a formatos limpios como PDF o un nuevo Excel. Construida sin frameworks complejos para asegurar su portabilidad y facilidad de uso.

## 🚀 Características Principales

*   **Contador de Visitas Integrado**: Registra y muestra en tiempo real en la parte superior el número total de visitas al sistema, persistido de forma segura en `localStorage`.
*   **Bitácora de Archivos y Auditoría de Acciones**: Registra automáticamente cada archivo procesado (nombre, tamaño, fecha/hora, productos y precio inicial) y cada acción realizada por el usuario (filtros, búsquedas, exportaciones, impresiones y reinicios).
*   **Página Dedicada de Reportes (`reportes.html`)**: Panel con tarjetas de indicadores (KPIs), tablas interactivas con filtros y opción para exportar la bitácora completa a Excel o reiniciar el historial.
*   **Selección Dinámica de Precios (Combobox)**: Permite alternar al instante entre **PRECIO 1** (Columna H), **PRECIO 2** (Columna I), **PRECIO 3** (Columna K) y **PRECIO 4** (Columna M), actualizando la vista interactiva, el reporte PDF y el archivo Excel exportado.
*   **Limpieza de Datos Automática**: Está programada para buscar automáticamente la hoja `Sheet0`, extraer las columnas de catálogo y precios, normalizar formatos erróneos y ordenar alfabéticamente el inventario.
*   **Buscador en Tiempo Real**: Filtra instantáneamente el catálogo a medida que escribes, gracias a una lógica optimizada en Vanilla JS.
*   **Paginación Inteligente**: La vista interactiva divide la lista en bloques de 50 elementos para que la aplicación siempre responda a la velocidad de la luz, sin importar si tu catálogo tiene miles de productos.
*   **Exportación a Excel Refinada**: Genera un nuevo archivo Excel (`Lista_de_Precios_Pumpo.xlsx`) con un membrete estructurado, listo para enviar a clientes.
*   **Impresión a PDF Optimizada**: Cuenta con un diseño específico de CSS (`@media print`) que inyecta automáticamente el membrete en cada página, limpia colores de fondo para ahorrar tinta y crea tablas continuas perfectas.
*   **UI Premium & Glassmorphism**: Interfaz moderna en tonos azules profundos con efectos de cristal translúcido y diseño responsivo adaptado a dispositivos móviles.

## 🛠️ Tecnologías Utilizadas

*   **HTML5** (Semántico)
*   **CSS3** (Variables CSS, Flexbox, `@media print`, Glassmorphism)
*   **Vanilla JavaScript (ES6)** (Sin dependencias pesadas como Node.js, React o NPM)
*   **[SheetJS (xlsx)](https://sheetjs.com/)** (Para procesamiento y exportación de archivos Excel)
*   **Web Storage API (localStorage)** (Persistencia local segura sin servidor)
*   **[Lucide Icons](https://lucide.dev/)** (Iconografía SVG)
*   **Google Fonts** (Tipografía Inter)

## 📁 Estructura del Proyecto

```
bodegas-pumpo/
│
├── index.html        # Gestor de catálogo principal y plantillas de impresión
├── reportes.html     # Panel de bitácora, estadísticas y auditoría de eventos
├── styles.css        # Reglas de diseño (UI Web, Glassmorphism, Tablas y Media Print)
├── app.js            # Lógica central del catálogo (Lectura Excel, filtrado, exportación)
├── bitacora.js       # Módulo compartido de auditoría, visitas y persistencia
├── reportes.js       # Lógica del panel de reportes, KPIs y descarga de bitácora
└── imgs/
    └── logopumpo.png # Logo corporativo de la empresa
```

## ⚙️ Cómo Usarlo

Al no requerir compilación ni un servidor web activo, utilizar esta aplicación es extremadamente sencillo:

1.  **Clona o descarga** este repositorio en tu computadora.
2.  Asegúrate de que la imagen `logopumpo.png` esté dentro de la carpeta `imgs`.
3.  Haz doble clic en el archivo `index.html`. Se abrirá en tu navegador web predeterminado (Chrome, Edge, Safari, Firefox).
4.  Arrastra tu archivo `articulosExportados.xls` a la zona punteada o usa el botón para buscarlo.
5.  ¡Listo! Puedes buscar productos, exportar la vista limpia a un nuevo Excel, o presionar "Convertir a PDF".

### 📄 Nota Importante sobre la Impresión (PDF)
Para asegurar que los números de página se rendericen correctamente sin alterar la continuidad de la tabla, debes habilitar la opción de tu navegador:
*   Al abrir el diálogo de impresión (Ctrl + P), ve a **Más opciones de configuración**.
*   Activa la casilla **"Encabezados y pies de página"**. El navegador se encargará de poner "Página 1 de X" de forma nativa en los márgenes configurados.

## 🤝 Contribuciones
Este proyecto fue diseñado a la medida para BODEGAS PUMPO. Si deseas realizar un *fork* para adaptarlo a otro sistema de inventarios, asegúrate de revisar los índices de extracción de columnas en `app.js` (`row.C` para descripción, y `row.H`, `row.I`, `row.K`, `row.M` para PRECIO 1, 2, 3 y 4 respectivamente).
