export function exportTableToCSV(filename, tableId = "results") {
    const csv = [];
    // Supports both <div id="results"><table>...</table></div> and <table id="tableId">...</table> patterns
    const rows = document.querySelectorAll(`#${tableId} table tr, table#${tableId} tr`);

    for (const row of rows) {
        const cols = row.querySelectorAll("td, th");
        const rowData = [];
        for (const col of cols) {
            rowData.push(col.innerText);
        }
        csv.push(rowData.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export function exportTableToHTML(filename, tableId = "results") {
    const table = document.querySelector(`#${tableId} table, table#${tableId}`);
    if (!table) return;
    const htmlFile = new Blob([table.outerHTML], { type: "text/html" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(htmlFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
