# Guía de Exportación de Reportes a PDF — Lógica Reutilizable

Documento arquitectónico para implementar exportación profesional de reportes en PDF en cualquier stack (backend/frontend, cualquier framework).

---

## 1. Decisión Fundamental: Dónde Generar el PDF

| Criterio | Client-Side | Server-Side |
|----------|------------|------------|
| **Caso de uso** | Tablas simples, datos en página | Datos grandes, auditoría, embellecimiento |
| **Performance** | Instantáneo, zero latencia | Depende servidor, pero datos pre-procesados |
| **Branding** | Logo/fonts desde CDN o assets | Logo/fonts en servidor, inyectable |
| **Tamaño datos** | <10K rows | >10K rows, requiere paginación automática |
| **Seguridad** | Datos visibles en browser | Datos quedan en servidor (auditables) |
| **Dependencias** | jsPDF, React PDF, html2canvas | Node PDF libs (puppeteer, pdfkit, pdfmake) |
| **Acceso** | Sin latencia de red | Requiere endpoint HTTP |

### Decision Tree
```
¿Datos > 50K rows?
  → SI: Servidor (requiere streaming/paginación automática)
  → NO: Pregunta siguiente

¿Necesita auditoría/compliance?
  → SI: Servidor (IP, timestamp, user agent)
  → NO: Pregunta siguiente

¿PDF se envía por email o descarga directa?
  → Email: Servidor (generación asincrónica)
  → Descarga: Cliente (instantáneo) O Servidor (si tiene branding dinamico)

¿Datos sensibles?
  → SI: Servidor (nunca exponerlos en browser)
  → NO: Pregunta siguiente

¿Diseño pixel-perfect, complejo?
  → SI: Servidor (Puppeteer renderiza HTML completo)
  → NO: Cliente (jsPDF/pdfmake rápido y simple)
```

### Server-Side (Node.js)

**Puppeteer** (Headless Chrome)
```
Ideal para: Pixel-perfect, diseño web existente, gráficos SVG
Peso: ~500KB (incluye Chrome)
API: Renderiza URL → PDF con control granular (viewport, margins, headers, footers)
Tradeoff: Pesado, requiere display/Xvfb en Linux headless
Performance: 2-5s por PDF, no recomendado para miles simultáneos
```

**pdfmake** (Generador PDF puro)
```
Ideal para: Reportes con estructura predefinida, tablas grandes
Peso: ~50KB
API: Definición JSON/JS de layout, columnas, estilos
Tradeoff: No renderiza CSS, requiere convertir diseño a definición pdfmake
Performance: <500ms por PDF, escalable
```

**pdfkit** (Bajo nivel, máximo control)
```
Ideal para: PDFs completamente custom, generación dinámica compleja
Peso: ~15KB
API: Canvas-like (drawText, drawImage, drawRect)
Tradeoff: Curva de aprendizaje, sin abstracción de layout
Performance: <200ms, muy escalable
```

---

## 3. Arquitectura Genérica

### Flujo Client-Side
```
[Página React/Vue/Angular]
    ↓
[Usuario clickea "Exportar PDF"]
    ↓
[Aplicar filtros/selección de columnas]
    ↓
[Prepare datos: formato, localización]
    ↓
[Generar PDF en memoria con jsPDF o @react-pdf/renderer]
    ↓
[Crear blob descargable]
    ↓
[Trigger descarga: window.URL.createObjectURL → <a> click]
    ↓
[Log opcional a backend (qué usuario, cuándo)]
```

### Flujo Server-Side
```
[Página React/Vue/Angular]
    ↓
[Usuario clickea "Exportar PDF"]
    ↓
[POST /api/exports con filtros, columnas, formato]
    ↓
[Backend valida permisos]
    ↓
[Backend obtiene datos (DB query con filtros)]
    ↓
[Backend genera PDF con pdfmake/puppeteer/pdfkit]
    ↓
[Backend guarda en storage temporal (Redis/FS) O streama directo]
    ↓
[Backend log: IP, user, timestamp, filtros aplicados → audit_logs]
    ↓
[HTTP 200 + PDF en body con Content-Disposition: attachment]
    ↓
[Browser descarga automático]
```

---

## 4. Componentes Mínimos Requeridos

### Data Layer
```typescript
// Interfaz genérica de datos para export
interface ExportData {
  rows: Record<string, any>[];
  columns: ExportColumn[];
  metadata: {
    title: string;
    generatedAt: ISO8601;
    generatedBy: string;
    dateRange?: { from: ISO8601; to: ISO8601 };
    filters: Record<string, any>;
  };
}

interface ExportColumn {
  key: string;              // Nombre de campo en datos
  label: string;            // Encabezado visible
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  width?: number;           // Porcentaje o pt
  alignment?: 'left' | 'center' | 'right';
  format?: (value: any) => string;  // Formateador custom
}
```

### PDF Config Layer
```typescript
interface PDFExportConfig {
  // Layout
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  
  // Branding
  logo?: string;                           // URL o base64
  headerText?: string;                     // Ej: "REPORTE CONFIDENCIAL"
  footerText?: string;                     // Ej: compañía, disclaimer
  companyName?: string;
  colors: {
    primary: string;        // RGB hex
    accent: string;
    textLight: string;
    textDark: string;
  };
  
  // Fuentes
  fontFamily: 'Arial' | 'Helvetica' | 'Times' | 'Courier';
  fontSize: { body: number; header: number; footer: number };
  
  // Tabla
  striped: boolean;                         // Filas alternas color
  headerBgColor: string;
  headerTextColor: string;
  
  // Opciones
  repeatHeaderOnPages: boolean;              // Repetir headers en cada página
  pageNumbering: boolean;                    // "Page X of Y"
  lineNumbers: boolean;
  
  // Formato de datos
  locale: 'es-EC' | 'es-ES' | 'en-US';     // Para fechas, moneda, números
}
```

### Generator Service (pseudo-código agnóstico)
```typescript
class PDFExportService {
  
  async generatePDF(
    data: ExportData,
    config: PDFExportConfig,
    library: 'jspdf' | 'pdfmake' | 'puppeteer'
  ): Promise<Blob> {
    
    // 1. Validar datos
    this.validateData(data);
    
    // 2. Formatear datos según locale y tipos de columna
    const formattedData = this.formatRows(data.rows, data.columns, config.locale);
    
    // 3. Calcular geometría (tablas, márgenes, roturas de página)
    const geometry = this.calculateGeometry(
      formattedData,
      data.columns,
      config
    );
    
    // 4. Renderizar basado en librería
    let pdf: Blob;
    switch (library) {
      case 'jspdf':
        pdf = await this.renderWithJsPDF(formattedData, data.columns, geometry, config);
        break;
      case 'pdfmake':
        pdf = await this.renderWithPdfMake(formattedData, data.columns, geometry, config);
        break;
      case 'puppeteer':
        pdf = await this.renderWithPuppeteer(formattedData, data.columns, geometry, config);
        break;
    }
    
    return pdf;
  }
  
  private formatRows(
    rows: Record<string, any>[],
    columns: ExportColumn[],
    locale: string
  ): Record<string, string>[] {
    return rows.map(row => {
      const formatted: Record<string, string> = {};
      
      for (const col of columns) {
        let value = row[col.key];
        
        // Aplicar formato específico de tipo
        if (col.format) {
          formatted[col.key] = col.format(value);
        } else {
          switch (col.type) {
            case 'date':
              formatted[col.key] = new Intl.DateTimeFormat(locale).format(new Date(value));
              break;
            case 'currency':
              formatted[col.key] = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'USD'  // Usar currency de config
              }).format(value);
              break;
            case 'number':
              formatted[col.key] = new Intl.NumberFormat(locale).format(value);
              break;
            default:
              formatted[col.key] = String(value || '');
          }
        }
      }
      
      return formatted;
    });
  }
  
  private calculateGeometry(
    rows: Record<string, string>[],
    columns: ExportColumn[],
    config: PDFExportConfig
  ): Geometry {
    // Calcular:
    // - Ancho total disponible (pageWidth - margins)
    // - Ancho por columna (relativo o fijo)
    // - Alto de fila (considera text wrapping)
    // - Número de páginas (si cada página = N filas + 1 header + 1 footer)
    
    return {
      pageWidth: config.pageSize === 'A4' ? 210 : 216,  // mm
      pageHeight: config.pageSize === 'A4' ? 297 : 280,
      contentWidth: 210 - config.margins.left - config.margins.right,
      rowsPerPage: Math.floor((pageHeight - margins) / rowHeight),
      totalPages: Math.ceil(rows.length / rowsPerPage),
      columnWidths: this.calculateColumnWidths(columns, contentWidth)
    };
  }
}
```

---

## 5. Customización: Checklist de Features

### Básico (MVP)
- [ ] Exportar tabla simple a PDF
- [ ] Encabezados de tabla visibles
- [ ] Colores alternos (striped)
- [ ] Números de página "Page X of Y"
- [ ] Descargar con nombre automático (ej: `report_2026-09-18.pdf`)

### Intermedio
- [ ] Logo de compañía (header)
- [ ] Título, fecha, rango de filtros en cover
- [ ] Selección de columnas (usuario elige qué columnas mostrar)
- [ ] Subtotales por grupo (ej: total por departamento)
- [ ] Cambiar orientación (portrait/landscape)
- [ ] Locale personalizado (fechas, moneda, números en idioma local)

### Avanzado
- [ ] Gráficos (charts) embebidos en PDF (Chart.js → canvas → PDF)
- [ ] Watermark (ej: "CONFIDENCIAL" diagonal trasparente)
- [ ] Pie de página con disclaimer legal
- [ ] Columnas congeladas (primera columna repite en cada página)
- [ ] Paginación automática con headers repetidos
- [ ] Fonts embebidas (no depender de fonts del sistema)
- [ ] Auditoría: log de quién exportó, cuándo, qué filtros

### Compliance
- [ ] PDF/A (PDF archivable, para legal)
- [ ] Accesibilidad (PDF/UA): estructura lógica, alt text para imágenes
- [ ] Encriptación: documento protegido con contraseña (lectura o edición)
- [ ] Firma digital (PKCS#7 o similar)
- [ ] Metadatos: title, author, creation date embebidos en PDF

---

## 6. Lógica de Paginación Automática

Problema: tabla con 10K filas, ¿cómo distribuir en múltiples páginas?

### Estrategia 1: Altura Fija
```
- PageHeight = 297mm (A4)
- Margins = 20mm top/bottom
- Available height = 257mm
- Row height = 8mm (incluye padding, border)
- Rows per page = 257 / 8 = 32 filas
- Total pages = ceil(10000 / 32) = 313 páginas
- Problema: header+footer no actualiza, pagination puede romper grupo
```

### Estrategia 2: Row Group Aware
```
- Grupo = departamento
- No partir grupo en dos páginas
- Si filas restantes en página < filas de siguiente grupo
  → Comenzar grupo en nueva página
- Implementación: iterar filas, llenar página hasta límite,
  buscar siguiente boundary (cambio de grupo), backtrack si es necesario
```

### Estrategia 3: Adaptive Row Height
```
- Calcular altura de cada fila según contenido
  (especialmente si hay columnas con text wrap)
- Usar binary search para encontrar máximo de filas que caben
- Más preciso pero más lento (recálculo por página)
```

---

## 7. Inyección de Branding Dinámico

Problema: Logo, colores, empresa name vienen de base de datos. Cómo inyectarlos?

### Client-Side
```typescript
// En servicio de export
const branding = await api.get('/company/branding');
const config: PDFExportConfig = {
  logo: branding.logo_url,  // Ya es URL absoluta del CDN
  colors: {
    primary: branding.primary_color,    // "#0066cc"
    accent: branding.secondary_color,
    ...
  },
  companyName: branding.name,
};

// Si logo es local file (upload), convertir a base64
if (branding.logo_file) {
  const base64 = await fileToBase64(branding.logo_file);
  config.logo = `data:image/png;base64,${base64}`;
}

const pdf = await exportService.generatePDF(data, config);
```

### Server-Side
```typescript
// En endpoint POST /api/exports
@Post('/exports')
async exportReport(@Body() req: ExportRequest, @Req() request) {
  // 1. Obtener branding de la compañía del usuario
  const company = await this.companyService.getByUser(request.user.id);
  const branding = company.branding;  // Precargado en DB
  
  // 2. Leer logo desde filesystem o S3
  const logoBuffer = await this.storageService.read(`logos/${company.id}.png`);
  const logoBase64 = logoBuffer.toString('base64');
  
  // 3. Armar config
  const config: PDFExportConfig = {
    logo: `data:image/png;base64,${logoBase64}`,
    colors: {
      primary: branding.primary_color,
      ...
    },
    companyName: company.name,
  };
  
  // 4. Generar PDF
  const pdf = await this.pdfService.generatePDF(data, config);
  
  // 5. Audit log
  await this.auditService.log({
    user_id: request.user.id,
    action: 'EXPORT_REPORT',
    resource: 'handbook',
    timestamp: new Date(),
    ip_address: request.ip,
    user_agent: request.get('user-agent'),
    filters: req.filters,
  });
  
  // 6. Stream PDF
  response.set('Content-Disposition', `attachment; filename="report_${Date.now()}.pdf"`);
  response.set('Content-Type', 'application/pdf');
  response.send(pdf);
}
```

---

## 8. Internacionalización (i18n) en PDFs

```typescript
interface PDFExportConfig {
  locale: 'es-EC' | 'es-ES' | 'en-US' | 'fr-FR';  // BCP 47
  timezone?: 'America/Guayaquil' | 'UTC';
}

// Formatear números según locale
const numberFormatter = new Intl.NumberFormat(config.locale);
numberFormatter.format(1234.56);  // "1.234,56" (es) vs "1,234.56" (en)

// Formatear fechas
const dateFormatter = new Intl.DateTimeFormat(config.locale, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
dateFormatter.format(new Date());  // "18 de septiembre de 2026" (es-EC)

// Strings traducibles en header/footer
const i18n = {
  'es-EC': {
    'page': 'Página',
    'of': 'de',
    'confidential': 'CONFIDENCIAL',
    'generated': 'Generado',
  },
  'en-US': {
    'page': 'Page',
    'of': 'of',
    'confidential': 'CONFIDENTIAL',
    'generated': 'Generated',
  },
};

// En renderizador
const headerText = `${i18n[config.locale]['page']} ${pageNumber} ${i18n[config.locale]['of']} ${totalPages}`;
```

---

## 9. Performance & Optimización

### Client-Side
```
Problema: jsPDF + 10K rows = congelamiento UI
Solución:
  1. Worker thread (Web Worker): generar PDF en background
  2. Streaming: generar página a página, ir acumulando blob
  3. Paginación lazy: usuario elige rango de fechas, limit filas
  4. Virtualization: no cargar todas las filas en memoria

Ejemplo Web Worker:
  Main thread → postMessage({ data, config }) → Worker thread
  Worker thread: genera PDF → postMessage(blob) → Main thread descarga
```

### Server-Side
```
Problema: N usuarios simultáneos → N procesos Puppeteer = OOM
Solución:
  1. Connection pool: 4-8 browser instances, queue requests
  2. Timeout: cancelar PDF si > 30s
  3. Memory limit: restart worker cada 100 PDFs
  4. Cache: si 2 usuarios exportan igual reporte mismo día, reutilizar
  5. Async queue: usar Bull, RabbitMQ, SQS para reportes grandes

Ejemplo pseudo-código:
  const pdfQueue = new Queue('pdf-export', { redis });
  
  @Post('/exports')
  async exportReport(@Body() req) {
    const jobId = await pdfQueue.add(
      { userId, filters, config },
      { priority: req.isPriority ? 1 : 10 }
    );
    
    return { job_id: jobId, status_url: `/jobs/${jobId}` };
  }
  
  pdfQueue.process(4, async (job) => {  // 4 workers
    const pdf = await this.generatePDF(job.data);
    return { url: await this.uploadToS3(pdf) };
  });
```

---

## 10. Error Handling & Edge Cases

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| **"Memory exceeded"** | Tabla muy grande o imágenes sin comprimir | Limitar rows (<10K), comprimir imágenes, usar server-side |
| **"Font not found"** | Fuente no embebida en PDF | Usar solo fonts estándar PDF (Arial, Helvetica) O embeber .ttf |
| **"Column wrap no funciona"** | jsPDF no soporta text wrapping automático | Usar pdfmake (tiene word-wrap) O calcular alto manualmente |
| **"Logo pixelado"** | Imagen small escalada | Usar SVG en lugar de PNG, o imagen 300dpi mínimo |
| **"Colores no salen iguales"** | RGB vs CMYK | PDF es RGB por defecto, igual que pantalla. Si imprenta requiere CMYK, convertir con ImageMagick |
| **"PDF descargado corrupto"** | Stream interrupted | Usar `Content-Length` header, no confiar solo en `Transfer-Encoding: chunked` |

### Edge Cases

```typescript
// Filas vacías
if (data.rows.length === 0) {
  return generateEmptyStatePDF("No hay datos para exportar", config);
}

// Columnas sin ancho definido
columns.forEach(col => {
  col.width = col.width || (100 / columns.length);  // Distribuir equitativo
});

// Valores null/undefined
rows.forEach(row => {
  Object.keys(row).forEach(key => {
    if (row[key] == null) {
      row[key] = '';  // O un placeholder como "N/A"
    }
  });
});

// Textos muy largos que rompen tabla
config.maxTextLength = 50;  // Truncar + "..."
const truncate = (s) => s.length > 50 ? s.slice(0, 47) + '...' : s;

// Moneda desconocida
const currencySymbol = {
  'USD': '$',
  'EUR': '€',
  'COP': '$',
  'ARS': '$',
  'default': config.currency || 'USD',
}[config.currency] || '$';
```

---

## 11. Plantilla Mínima de Implementación

### Archivo: `export-service.ts`
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class PDFExportService {
  
  exportTableToPDF(
    rows: any[],
    columns: { key: string; label: string; type?: string }[],
    filename: string = 'report.pdf',
    config: Partial<PDFExportConfig> = {}
  ): Blob {
    const doc = new jsPDF(config.orientation || 'portrait');
    const defaultConfig = this.getDefaultConfig(config);
    
    // Formatear datos
    const formattedRows = rows.map(row =>
      columns.map(col => this.formatCell(row[col.key], col.type))
    );
    
    // Headers
    const headers = columns.map(col => col.label);
    
    // Agregar tabla
    autoTable(doc, {
      head: [headers],
      body: formattedRows,
      startY: 20,
      margin: { top: 15, right: 10, bottom: 15, left: 10 },
      didDrawPage: (data) => {
        // Footer con página
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageSize = (doc as any).internal.getPageSize();
        const pageHeight = pageSize.height;
        const pageWidth = pageSize.width;
        doc.setFontSize(8);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
      headStyles: { fillColor: defaultConfig.colors.primary, textColor: 255 },
      alternateRowStyles: { fillColor: defaultConfig.colors.striped },
      columnStyles: columns.reduce((acc, col, i) => {
        acc[i] = { halign: col.alignment || 'left' };
        return acc;
      }, {}),
    });
    
    return doc.output('blob');
  }
  
  private formatCell(value: any, type?: string): string {
    if (value == null) return '';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('es-EC');
      case 'currency':
        return new Intl.NumberFormat('es-EC', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('es-EC').format(value);
      default:
        return String(value);
    }
  }
  
  private getDefaultConfig(config: Partial<PDFExportConfig>): PDFExportConfig {
    return {
      orientation: 'portrait',
      pageSize: 'A4',
      locale: 'es-EC',
      colors: {
        primary: '#0066cc',
        striped: '#f0f0f0',
        textDark: '#000000',
        textLight: '#ffffff',
      },
      ...config,
    };
  }
}

// Uso
const service = new PDFExportService();
const blob = service.exportTableToPDF(
  employees,
  [
    { key: 'name', label: 'Nombre' },
    { key: 'salary', label: 'Salario', type: 'currency' },
    { key: 'hireDate', label: 'Fecha Ingreso', type: 'date' },
  ],
  'employees_2026-09-18.pdf'
);

// Descargar
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'employees_2026-09-18.pdf';
link.click();
```

---

## 12. Checklist de Pre-Producción

- [ ] Datos: validar que no hay valores null inesperados
- [ ] Paginación: probar con 1 fila, 100 filas, 10K filas
- [ ] Fonts: verificar que caracteres acentuados (é, ñ, ü) aparecen correctamente
- [ ] Colores: impresión en B&N no es ilegible
- [ ] Logo: verificar resolución en PDF (no pixelado)
- [ ] Números: locale correcto (coma vs punto decimal)
- [ ] Permisos: solo usuarios autorizados pueden exportar
- [ ] Auditoría: log grabado en cada exportación
- [ ] Rendimiento: tiempo < 3s para reportes <1K filas
- [ ] Nombres archivo: sin caracteres especiales, timestamp único
- [ ] Cleanup: blobs en memoria liberados después de descarga
- [ ] Accesibilidad: PDF tiene estructura (es leíble por screen reader)
- [ ] Compliance: si es legal/financiero, PDF/A o auditoría requerida

---

## Resumen

**La exportación de PDFs no es trivial.** La decisión más importante es **dónde generarlo** (cliente vs servidor), que define arquitectura, performance y seguridad.

- **Cliente**: Instantáneo, simple, riesgoso con datos sensibles
- **Servidor**: Auditable, robusto, requiere queue si es pesado

Una vez decidido, el flujo es repetible:
1. Definir data shape (`ExportData` + `ExportColumn`)
2. Definir config (branding, layout, i18n)
3. Implementar formatter (fechas, números, moneda por locale)
4. Implementar paginación (si >1000 filas)
5. Integrar branding dinámico (logo, colores de BD)
6. Agregar auditoría
7. Testear edge cases

Este documento cubre arquitectura agnóstica. Adaptarlo a tu stack específico (React, NestJS, etc.) es mecánico una vez que la lógica está clara.
