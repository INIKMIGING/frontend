/**
 * CSV Export Utility
 * Converts monitoring data to CSV format and triggers download
 */

/**
 * Exports data to CSV file
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column definitions { key: string, header: string, format?: function }
 * @param {string} filename - Output filename (without extension)
 */
export function exportToCSV(data, columns, filename) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV header row
  const headers = columns.map(col => col.header).join(',');
  
  // Create CSV data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Apply custom formatting if provided
      if (col.format && typeof col.format === 'function') {
        value = col.format(value, item);
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = 'N/A';
      }
      
      // Escape commas and quotes in values
      value = String(value);
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n');
  
  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Get current date for filename
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Helper function to get current timestamp in ISO format
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}
