import * as XLSX from 'xlsx-js-style';

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

    // Adiciona estilos para o cabeçalho e para os dados
    if (worksheet['!ref']) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cellRef]) continue;

                if (R === 0) {
                    // Cabeçalho (Linha 0)
                    worksheet[cellRef].s = {
                        fill: { fgColor: { rgb: "1E3A8A" } }, // Fundo azul escuro
                        font: { color: { rgb: "FFFFFF" }, bold: true }, // Texto branco e negrito
                        alignment: { vertical: "center", horizontal: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                } else {
                    // Informações / Dados (Linhas seguintes)
                    // Fundo alternado ou único
                    const isEven = R % 2 === 0;
                    worksheet[cellRef].s = {
                        fill: { fgColor: { rgb: isEven ? "F3F4F6" : "FFFFFF" } }, // Cinza claro alternado com branco
                        font: { color: { rgb: "111827" } },
                        alignment: { vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "D1D5DB" } },
                            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
                            left: { style: "thin", color: { rgb: "D1D5DB" } },
                            right: { style: "thin", color: { rgb: "D1D5DB" } }
                        }
                    };
                }
            }
        }
    }

    // Ajusta a largura das colunas dinamicamente baseado no maior texto (cabeçalho ou dados)
    const colWidths = columns.map(col => {
        const headerLength = col.label.length;
        const maxDataLength = data.reduce((max, item) => {
            const val = item[col.id] != null ? String(item[col.id]) : "";
            return Math.max(max, val.length);
        }, 0);
        // Dá um limite de 50 caracteres para a coluna não ficar excessivamente larga
        return { wch: Math.min(Math.max(headerLength, maxDataLength) + 5, 50) };
    });
    worksheet['!cols'] = colWidths;

    // Adiciona "Filtros" (AutoFilter) na primeira linha
    if (worksheet['!ref']) {
        worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gera o buffer do arquivo em formato base64
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    return excelBuffer;
}
