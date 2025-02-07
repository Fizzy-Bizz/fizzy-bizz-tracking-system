function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            displayCSVTable(csvData);
        };
        reader.onerror = function(event) {
            console.error('Error reading file:', event.target.error);
        };
        reader.readAsText(file);
    } else {
        alert('Please choose a CSV file first.');
    }
}

function displayCSVTable(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => line.split(','));

    const tableContainer = document.getElementById('tableContainer');
    const table = document.createElement('table');

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Clear previous table and add the new table
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}
