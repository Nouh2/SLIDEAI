/**
 * Utility to detect and parse tabular data from clipboard text.
 * Handles CSV, TSV (Excel/Google Sheets), and basic table structures.
 */

export interface ParsedTableData {
    headers: string[];
    rows: string[][];
    sourceType: 'csv' | 'tsv' | 'json';
    isNumeric: boolean; // True if most data columns are numeric
}

/**
 * Attempts to parse raw text as tabular data.
 * Returns null if the data doesn't look like a table.
 */
export const parseClipboardData = (rawText: string, htmlText?: string): ParsedTableData | null => {
    // Priority 1: HTML Content (often much cleaner from Excel/Web)
    if (htmlText) {
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        const table = doc.querySelector('table');
        if (table) {
            const rows: string[][] = [];
            const trs = table.querySelectorAll('tr');

            trs.forEach(tr => {
                const cells = tr.querySelectorAll('td, th');
                if (cells.length > 0) {
                    rows.push(Array.from(cells).map(cell => cell.textContent?.trim() || ''));
                }
            });

            if (rows.length > 0) {
                const headers = rows[0];
                const contentRows = rows.length > 1 ? rows.slice(1) : rows;

                // Numeric detection: Check if any column (index > 0) is predominantly numeric
                let isNumeric = false;
                if (contentRows.length > 0 && headers.length > 1) {
                    for (let colIdx = 1; colIdx < headers.length; colIdx++) {
                        let numericCells = 0;
                        contentRows.forEach(row => {
                            const cell = row[colIdx];
                            if (cell && !isNaN(Number(cell.replace(/[^0-9.-]/g, '')))) numericCells++;
                        });
                        if (numericCells / contentRows.length > 0.7) {
                            isNumeric = true;
                            break;
                        }
                    }
                }

                return {
                    headers: rows.length > 1 ? headers : headers.map((_, i) => `Col ${i + 1}`),
                    rows: rows.length > 1 ? rows.slice(1) : rows,
                    sourceType: 'json',
                    isNumeric
                };
            }
        }
    }

    // Priority 2: Plain Text fallback
    if (!rawText || rawText.length > 100000) return null;

    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length === 0) return null;

    const delimiters = ['\t', ',', ';'];
    let bestDelimiter = '';
    let maxColumns = 0;
    let consistencyScore = 0;

    for (const delimiter of delimiters) {
        const counts = lines.map(line => line.split(delimiter).length);
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

        // Check consistency
        const deviations = counts.filter(c => Math.abs(c - avg) > 1).length;
        const currentScore = (1 - (deviations / (lines.length || 1))) * avg;

        if (currentScore > consistencyScore && avg >= 1.2) {
            consistencyScore = currentScore;
            bestDelimiter = delimiter;
            maxColumns = Math.round(avg);
        }
    }

    // If it's a single line and contains the best delimiter, allow it
    if (lines.length === 1 && bestDelimiter && maxColumns >= 2) {
        const row = lines[0].split(bestDelimiter).map(c => c.trim());
        const isNumeric = row.slice(1).some(c => !isNaN(Number(c.replace(/[^0-9.-]/g, ''))));
        return {
            headers: row.map((_, i) => `Col ${i + 1}`),
            rows: [row],
            sourceType: bestDelimiter === '\t' ? 'tsv' : 'csv',
            isNumeric
        };
    }

    if (!bestDelimiter || maxColumns < 2) return null;

    const parseLine = (line: string, delimiter: string): string[] => {
        if (delimiter === '\t') return line.split('\t');
        const result: string[] = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === delimiter && !inQuote) {
                result.push(current.trim());
                current = '';
            } else current += char;
        }
        result.push(current.trim());
        return result;
    };

    const rows = lines.map(line => parseLine(line, bestDelimiter));
    const headers = rows[0].map(h => h.replace(/^"(.*)"$/, '$1').trim());
    const dataRows = rows.slice(1).map(row => row.map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));
    const validRows = dataRows.filter(row => row.some(cell => cell.length > 0));

    if (validRows.length === 0 && lines.length > 1) {
        return {
            headers: headers.map((_, i) => `Col ${i + 1}`),
            rows: [headers],
            sourceType: bestDelimiter === '\t' ? 'tsv' : 'csv',
            isNumeric: false
        };
    }

    // Improved numeric detection: Check if any column (index > 0) is predominantly numeric
    let isNumeric = false;
    if (validRows.length > 0 && headers.length > 1) {
        const testRows = validRows.slice(0, 20); // Check up to 20 rows
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
            let numericCells = 0;
            testRows.forEach(row => {
                const cell = row[colIdx];
                if (cell && !isNaN(Number(cell.replace(/[^0-9.-]/g, '')))) numericCells++;
            });
            if (numericCells / testRows.length > 0.7) {
                isNumeric = true;
                break;
            }
        }
    }

    return {
        headers,
        rows: validRows.length > 0 ? validRows : [headers],
        sourceType: bestDelimiter === '\t' ? 'tsv' : 'csv',
        isNumeric
    };
};

/**
 * Creates a new slide object from parsed table data.
 */
export const createSlideFromTable = (data: ParsedTableData, type: 'table' | 'chart' = 'table'): any => {
    if (type === 'chart') {
        const categories = data.rows.map(row => row[0]);
        const series = data.headers.slice(1).map((header, i) => ({
            name: header,
            data: data.rows.map(row => Number(row[i + 1]?.replace(/[^0-9.-]/g, '')) || 0)
        }));

        return {
            id: `slide-smart-paste-chart-${Date.now()}`,
            type: 'chart',
            title: 'Data Visualization',
            layout: 'chart',
            variation: 'chart-showcase',
            chart: {
                type: series.length > 1 ? 'column' : 'bar',
                categories,
                series
            },
            content: {
                title: 'Data Visualization',
                chart: {
                    type: series.length > 1 ? 'column' : 'bar',
                    categories,
                    series
                }
            }
        };
    }

    return {
        id: `slide-smart-paste-table-${Date.now()}`,
        type: 'table',
        title: 'Data Imported',
        layout: 'table',
        table: {
            columns: data.headers,
            rows: data.rows
        },
        content: {
            title: 'Imported Data',
            table: {
                columns: data.headers,
                rows: data.rows
            }
        }
    };
};
