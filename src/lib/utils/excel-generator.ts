import * as XLSX from 'xlsx';

/**
 * Interface for column configuration
 */
export interface ExcelColumn {
    id: string;
    label: string;
}

/**
 * Generates an Excel (XLSX) file from data and columns.
 * Can return a base64 string for e-mail attachments or a Blob for browser downloads.
 */
export function generateExcelBase64(data: any[], columns: ExcelColumn[], sheetName: string = "Relatório") {
    // Transforma os dados para o formato que o XLSX espera usando os labels das colunas como cabeçalho
    const formattedData = data.map(item => {
        const row: Record<string, any> = {};
        columns.forEach(col => {
            row[col.label] = item[col.id] ?? "";
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gera o buffer do arquivo em formato base64
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    return excelBuffer;
}
