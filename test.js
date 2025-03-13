// Enhanced version of processFile function
function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            const { headers, rows } = parseCSVData(csvData);
            
            // Display the raw CSV data
            displayCSVTable(headers, rows);
            
            // Analyze the sales data
            analyzeSalesData(headers, rows);
        };
        reader.onerror = function(event) {
            console.error('Error reading file:', event.target.error);
        };
        reader.readAsText(file);
    } else {
        alert('Please choose a CSV file first.');
    }
}

// Improved CSV parser that handles quoted fields
function parseCSVData(csvData) {
    // Split into lines
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    const headers = parseCSVLine(lines[0]);
    
    // Parse each row
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length === headers.length) {
            rows.push(row);
        }
    }
    
    return { headers, rows };
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    if (current.trim()) {
        result.push(current.trim());
    }
    
    return result;
}

// Updated function to display CSV data
function displayCSVTable(headers, rows) {
    const tableContainer = document.getElementById('tableContainer');
    
    // Create a title for the raw data table
    const rawDataTitle = document.createElement('h2');
    rawDataTitle.textContent = 'Raw Sales Data';
    tableContainer.innerHTML = '';
    tableContainer.appendChild(rawDataTitle);
    
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

    // Add the table to the container
    tableContainer.appendChild(table);
}

// New function to analyze sales data
function analyzeSalesData(headers, rows) {
    // Determine column indices based on your CSV format
    const categoryIndex = headers.findIndex(header => header === 'Category');
    const itemIndex = headers.findIndex(header => header === 'Item');
    const qtyIndex = headers.findIndex(header => header === 'Qty');
    const pricePointIndex = headers.findIndex(header => header === 'Price Point Name');
    const modifiersIndex = headers.findIndex(header => header === 'Modifiers Applied');
    
    // Filter out non-drink items (like cookies, straw toppers, etc.)
    const drinkRows = rows.filter(row => {
        const category = row[categoryIndex];
        return category !== 'None'; // Exclude non-drink categories
    });
    
    // Count total drinks sold
    const totalDrinks = drinkRows.reduce((sum, row) => {
        const quantity = parseInt(row[qtyIndex], 10) || 1; // Default to 1 if parsing fails
        return sum + quantity;
    }, 0);
    
    // Extract base soda types and counts
    const baseSodaCounts = {};
    drinkRows.forEach(row => {
        const pricePoint = row[pricePointIndex];
        const quantity = parseInt(row[qtyIndex], 10) || 1;
        
        // Extract the base soda type from the Price Point Name
        let baseSoda = extractBaseSoda(pricePoint);
        
        if (baseSoda) {
            if (baseSoda in baseSodaCounts) {
                baseSodaCounts[baseSoda] += quantity;
            } else {
                baseSodaCounts[baseSoda] = quantity;
            }
        } else {
            // Try to determine base soda from category or item
            const category = row[categoryIndex];
            const item = row[itemIndex];
            
            if (category.includes('Coke')) {
                baseSoda = 'Coke';
            } else if (category.includes('Sprite')) {
                baseSoda = 'Sprite';
            } else if (category.includes('Dr. Pepper')) {
                baseSoda = 'Dr. Pepper';
            } else if (category.includes('Root Beer')) {
                baseSoda = 'Root Beer';
            } else if (category.includes('Lemonade')) {
                baseSoda = 'Lemonade';
            } else if (category === 'Build Your Own Soda') {
                const match = item.match(/Custom\s+(\w+)/);
                if (match) {
                    baseSoda = match[1];
                } else {
                    baseSoda = 'Other';
                }
            } else {
                baseSoda = 'Other';
            }
            
            if (baseSoda in baseSodaCounts) {
                baseSodaCounts[baseSoda] += quantity;
            } else {
                baseSodaCounts[baseSoda] = quantity;
            }
        }
    });
    
    // Count drinks by size
    const sizeCounts = {};
    drinkRows.forEach(row => {
        const pricePoint = row[pricePointIndex];
        const quantity = parseInt(row[qtyIndex], 10) || 1;
        
        // Extract size from the Price Point Name
        const size = extractSize(pricePoint);
        
        if (size) {
            if (size in sizeCounts) {
                sizeCounts[size] += quantity;
            } else {
                sizeCounts[size] = quantity;
            }
        } else {
            // Default to Medium if size can't be determined
            if ('Medium' in sizeCounts) {
                sizeCounts['Medium'] += quantity;
            } else {
                sizeCounts['Medium'] = quantity;
            }
        }
    });
    
    // Calculate flavor usage (including modifiers)
    const flavorCounts = {};
    drinkRows.forEach(row => {
        const category = row[categoryIndex];
        const item = row[itemIndex];
        const modifiers = row[modifiersIndex] || '';
        const quantity = parseInt(row[qtyIndex], 10) || 1;
        
        // Extract flavors from modifiers
        const flavors = extractFlavors(modifiers);
        
        // Add flavors to count
        flavors.forEach(flavor => {
            if (flavor in flavorCounts) {
                flavorCounts[flavor] += quantity;
            } else {
                flavorCounts[flavor] = quantity;
            }
        });
        
        // Also count special drinks by their recipe name
        if (category === 'Specials' || 
            category === 'Coke Recipes' || 
            category === 'Sprite Recipes' || 
            category === 'Root Beer Recipes' || 
            category === 'Dr. Pepper Recipes' ||
            category === 'Italian Sodas') {
            
            const recipeName = item;
            if (recipeName in flavorCounts) {
                flavorCounts[recipeName] += quantity;
            } else {
                flavorCounts[recipeName] = quantity;
            }
        }
    });
    
    // Calculate syrup usage
    // Assumptions:
    // - Small: 2 oz of syrup
    // - Medium: 3 oz of syrup
    // - Large: 4 oz of syrup
    // - Each flavor adds 0.5 oz of syrup
    
    const syrupRatios = {
        'Small': 2,
        'Medium': 3,
        'Large': 4
    };
    
    const syrupUsage = {
        'Coke': 0,
        'Diet Coke': 0,
        'Coke Zero': 0,
        'Sprite': 0,
        'Sprite Zero': 0,
        'Dr. Pepper': 0,
        'Diet Dr. Pepper': 0,
        'Root Beer': 0,
        'IBC Root Beer': 0,
        'A&W Zero': 0,
        'Lemonade': 0,
        'Soda Water': 0
    };
    
    // Flavor syrups usage
    const flavorSyrupUsage = {};
    
    drinkRows.forEach(row => {
        const pricePoint = row[pricePointIndex];
        const modifiers = row[modifiersIndex] || '';
        const quantity = parseInt(row[qtyIndex], 10) || 1;
        
        // Extract base soda and size
        const baseSoda = extractBaseSoda(pricePoint) || 'Other';
        const size = extractSize(pricePoint) || 'Medium';
        
        // Calculate base syrup amount
        const syrupAmount = syrupRatios[size] || 3; // Default to Medium (3 oz)
        const baseSyrupTotal = syrupAmount * quantity;
        
        // Add to base syrup usage
        if (baseSoda !== 'Other' && baseSoda in syrupUsage) {
            syrupUsage[baseSoda] += baseSyrupTotal;
        }
        
        // Calculate flavor syrup usage
        const flavors = extractFlavors(modifiers);
        flavors.forEach(flavor => {
            const flavorSyrupAmount = 0.5 * quantity; // Assuming 0.5 oz per flavor
            
            if (flavor in flavorSyrupUsage) {
                flavorSyrupUsage[flavor] += flavorSyrupAmount;
            } else {
                flavorSyrupUsage[flavor] = flavorSyrupAmount;
            }
        });
    });
    
    // Display the results
    displayAnalysisResults(
        totalDrinks, 
        baseSodaCounts, 
        sizeCounts, 
        flavorCounts, 
        syrupUsage, 
        flavorSyrupUsage
    );
}

// Extract base soda type from the Price Point Name
function extractBaseSoda(pricePoint) {
    if (!pricePoint) return null;
    
    // Check for common base sodas
    if (pricePoint.includes('Coke Zero')) return 'Coke Zero';
    if (pricePoint.includes('Diet Coke')) return 'Diet Coke';
    if (pricePoint.includes('Coke')) return 'Coke';
    if (pricePoint.includes('Sprite Zero')) return 'Sprite Zero';
    if (pricePoint.includes('Sprite')) return 'Sprite';
    if (pricePoint.includes('Diet Dr. Pepper')) return 'Diet Dr. Pepper';
    if (pricePoint.includes('Dr. Pepper')) return 'Dr. Pepper';
    if (pricePoint.includes('IBC Root Beer')) return 'IBC Root Beer';
    if (pricePoint.includes('A&W Zero')) return 'A&W Zero';
    if (pricePoint.includes('Soda Water')) return 'Soda Water';
    
    return null;
}

// Extract size from the Price Point Name
function extractSize(pricePoint) {
    if (!pricePoint) return null;
    
    if (pricePoint.includes('Small')) return 'Small';
    if (pricePoint.includes('Mйdium') || pricePoint.includes('Medium')) return 'Medium';
    if (pricePoint.includes('Large')) return 'Large';
    
    return null;
}

// Extract flavors from the Modifiers Applied
function extractFlavors(modifiers) {
    if (!modifiers) return [];
    
    const flavors = [];
    const flavorPatterns = [
        /Add ([\w\s]+)/g,
        /Add ([\w\s&]+)/g
    ];
    
    // Apply each pattern and collect matches
    flavorPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(modifiers)) !== null) {
            // Extract the flavor name, remove the word "Add"
            const flavor = match[1].trim();
            if (flavor && !flavors.includes(flavor)) {
                flavors.push(flavor);
            }
        }
    });
    
    return flavors;
}

// Display analysis results
function displayAnalysisResults(
    totalDrinks, 
    baseSodaCounts, 
    sizeCounts, 
    flavorCounts, 
    syrupUsage, 
    flavorSyrupUsage
) {
    const tableContainer = document.getElementById('tableContainer');
    
    // Create a summary section
    const summaryDiv = document.createElement('div');
    summaryDiv.classList.add('analysis-summary');
    
    // Add total drinks summary
    const totalTitle = document.createElement('h2');
    totalTitle.textContent = 'Sales Summary';
    summaryDiv.appendChild(totalTitle);
    
    const totalPara = document.createElement('p');
    totalPara.textContent = `Total Drinks Sold: ${totalDrinks}`;
    summaryDiv.appendChild(totalPara);
    
    // Add to the container
    tableContainer.appendChild(summaryDiv);
    
    // Create base soda counts table
    const sodaTitle = document.createElement('h2');
    sodaTitle.textContent = 'Sales by Base Soda Type';
    tableContainer.appendChild(sodaTitle);
    
    const sodaTable = createSummaryTable(
        ['Base Soda', 'Quantity Sold', 'Percentage of Total'],
        Object.entries(baseSodaCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by quantity descending
            .map(([soda, count]) => [
                soda, 
                count.toString(), 
                `${((count / totalDrinks) * 100).toFixed(1)}%`
            ])
    );
    tableContainer.appendChild(sodaTable);
    
    // Create size counts table
    const sizeTitle = document.createElement('h2');
    sizeTitle.textContent = 'Sales by Size';
    tableContainer.appendChild(sizeTitle);
    
    const sizeTable = createSummaryTable(
        ['Size', 'Quantity Sold', 'Percentage of Total'],
        Object.entries(sizeCounts)
            .sort((a, b) => {
                // Custom sort: Small, Medium, Large
                const sizeOrder = { 'Small': 1, 'Medium': 2, 'Large': 3 };
                return sizeOrder[a[0]] - sizeOrder[b[0]];
            })
            .map(([size, count]) => [
                size, 
                count.toString(), 
                `${((count / totalDrinks) * 100).toFixed(1)}%`
            ])
    );
    tableContainer.appendChild(sizeTable);
    
    // Create flavor popularity table
    const flavorTitle = document.createElement('h2');
    flavorTitle.textContent = 'Popular Flavors and Recipes';
    tableContainer.appendChild(flavorTitle);
    
    const flavorTable = createSummaryTable(
        ['Flavor/Recipe', 'Times Used', 'Percentage of Drinks'],
        Object.entries(flavorCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .slice(0, 20) // Show top 20 flavors
            .map(([flavor, count]) => [
                flavor, 
                count.toString(), 
                `${((count / totalDrinks) * 100).toFixed(1)}%`
            ])
    );
    tableContainer.appendChild(flavorTable);
    
    // Create base syrup usage table
    const baseSyrupTitle = document.createElement('h2');
    baseSyrupTitle.textContent = 'Base Soda Syrup Usage';
    tableContainer.appendChild(baseSyrupTitle);
    
    const baseSyrupTable = createSummaryTable(
        ['Base Soda', 'Syrup Used (oz)', 'Syrup Used (gallons)'],
        Object.entries(syrupUsage)
            .filter(([_, amount]) => amount > 0) // Only show sodas that were used
            .sort((a, b) => b[1] - a[1]) // Sort by amount descending
            .map(([soda, ounces]) => [
                soda, 
                ounces.toFixed(1), 
                (ounces / 128).toFixed(2) // Convert ounces to gallons
            ])
    );
    tableContainer.appendChild(baseSyrupTable);
    
    // Create flavor syrup usage table
    const flavorSyrupTitle = document.createElement('h2');
    flavorSyrupTitle.textContent = 'Flavor Syrup Usage';
    tableContainer.appendChild(flavorSyrupTitle);
    
    const flavorSyrupTable = createSummaryTable(
        ['Flavor', 'Syrup Used (oz)', 'Syrup Used (gallons)'],
        Object.entries(flavorSyrupUsage)
            .sort((a, b) => b[1] - a[1]) // Sort by amount descending
            .map(([flavor, ounces]) => [
                flavor, 
                ounces.toFixed(1), 
                (ounces / 128).toFixed(3) // Convert ounces to gallons (more decimal places for small amounts)
            ])
    );
    tableContainer.appendChild(flavorSyrupTable);
    
    // Create total syrup usage summary
    const totalSyrupDiv = document.createElement('div');
    totalSyrupDiv.classList.add('analysis-summary');
    
    const totalBaseSyrup = Object.values(syrupUsage).reduce((sum, amount) => sum + amount, 0);
    const totalFlavorSyrup = Object.values(flavorSyrupUsage).reduce((sum, amount) => sum + amount, 0);
    const totalSyrup = totalBaseSyrup + totalFlavorSyrup;
    
    const syrupSummaryTitle = document.createElement('h2');
    syrupSummaryTitle.textContent = 'Total Syrup Usage Summary';
    totalSyrupDiv.appendChild(syrupSummaryTitle);
    
    const baseSyrupPara = document.createElement('p');
    baseSyrupPara.textContent = `Base Soda Syrup: ${totalBaseSyrup.toFixed(1)} oz (${(totalBaseSyrup / 128).toFixed(2)} gallons)`;
    totalSyrupDiv.appendChild(baseSyrupPara);
    
    const flavorSyrupPara = document.createElement('p');
    flavorSyrupPara.textContent = `Flavor Syrup: ${totalFlavorSyrup.toFixed(1)} oz (${(totalFlavorSyrup / 128).toFixed(2)} gallons)`;
    totalSyrupDiv.appendChild(flavorSyrupPara);
    
    const totalSyrupPara = document.createElement('p');
    totalSyrupPara.textContent = `Total Syrup: ${totalSyrup.toFixed(1)} oz (${(totalSyrup / 128).toFixed(2)} gallons)`;
    totalSyrupDiv.appendChild(totalSyrupPara);
    
    tableContainer.appendChild(totalSyrupDiv);
}

// Helper function to create summary tables
function createSummaryTable(headers, rows) {
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
    
    return table;
}