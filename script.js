// script.js

// Load and process data from the custom JSON format
fetch('sales_data.json')
    .then(response => response.json())
    .then(raw => {
        const salesData = raw['Sales Data'];
        const feedbackData = raw['Customer Feedback Scores'];
        const inventoryData = raw['Inventory Level Units'];

        // Merge data by Year and Month
        const mergedData = salesData.map(sale => {
            const year = sale['Year'];
            const month = sale['Month'];
            const feedback = feedbackData.find(f => f['Year'] === year && f['Month'] === month);
            const inventory = inventoryData.find(i => i['Year'] === year && i['Month'] === month);

            return {
                year,
                month,
                sales: sale['Sales (Php)'],
                feedback: feedback ? feedback['Feedback Score (1-5)'] : null,
                inventory: inventory ? inventory['Inventory Level (units)'] : null
            };
        });

        renderDescriptiveAnalytics(mergedData);
        renderPredictiveAnalytics(mergedData);
    });

function renderDescriptiveAnalytics(data) {
    const yearlySales = {};
    const monthlySales = [];
    let totalSales = 0;

    // Prepare Customer Feedback and Inventory Data
    const feedbackData = [];
    const inventoryData = [];

    data.forEach(item => {
        const year = item.year;
        const sales = item.sales;
        totalSales += sales;

        if (!yearlySales[year]) yearlySales[year] = 0;
        yearlySales[year] += sales;

        monthlySales.push({ label: `${item.month} ${item.year}`, sales });

        if (item.feedback !== null) {
            feedbackData.push({ label: `${item.month} ${item.year}`, score: item.feedback });
        }
        if (item.inventory !== null) {
            inventoryData.push({ label: `${item.month} ${item.year}`, inventory: item.inventory });
        }
    });

    const avgMonthlySales = (totalSales / data.length).toFixed(2);
    document.getElementById('totalSales').textContent = JSON.stringify(yearlySales);
    document.getElementById('avgSales').textContent = `₱${avgMonthlySales}`;

    // Populate Yearly Sales Table (screen reader only)
    const yearlySalesTable = document.getElementById('yearly-sales-table');
    if (yearlySalesTable) {
        yearlySalesTable.innerHTML = Object.entries(yearlySales)
            .map(([year, sales]) => `<tr><td>${year}</td><td>${sales}</td></tr>`)
            .join('');
    }

    // Populate Monthly Trend Table (screen reader only)
    const monthlyTrendTable = document.getElementById('monthly-trend-table');
    if (monthlyTrendTable) {
        monthlyTrendTable.innerHTML = monthlySales
            .map(e => `<tr><td>${e.label}</td><td>${e.sales}</td></tr>`)
            .join('');
    }

    // Populate Feedback Table (screen reader only)
    const feedbackTable = document.getElementById('feedback-table');
    if (feedbackTable) {
        feedbackTable.innerHTML = feedbackData
            .map(item => `<tr><td>${item.label}</td><td>${item.score}</td></tr>`)
            .join('');
    }

    // Populate Inventory Table (screen reader only)
    const inventoryTable = document.getElementById('inventory-table');
    if (inventoryTable) {
        inventoryTable.innerHTML = inventoryData
            .map(item => `<tr><td>${item.label}</td><td>${item.inventory}</td></tr>`)
            .join('');
    }

    // Yearly Sales Chart
    new Chart(document.getElementById('yearlySalesChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(yearlySales),
            datasets: [{
                label: 'Total Sales per Year',
                data: Object.values(yearlySales),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        }
    });

    // Monthly Trend Chart
    new Chart(document.getElementById('monthlyTrendChart'), {
        type: 'line',
        data: {
            labels: monthlySales.map(e => e.label),
            datasets: [{
                label: 'Monthly Sales',
                data: monthlySales.map(e => e.sales),
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false
            }]
        }
    });

    // Customer Feedback Chart
    new Chart(document.getElementById('feedbackChart'), {
        type: 'line',
        data: {
            labels: feedbackData.map(item => item.label),
            datasets: [{
                label: 'Customer Feedback Score',
                data: feedbackData.map(item => item.score),
                borderColor: 'rgba(153, 102, 255, 1)',
                fill: false
            }]
        }
    });

    // Inventory Levels Chart
    new Chart(document.getElementById('inventoryChart'), {
        type: 'bar',
        data: {
            labels: inventoryData.map(item => item.label),
            datasets: [{
                label: 'Inventory Levels',
                data: inventoryData.map(item => item.inventory),
                backgroundColor: 'rgba(255, 206, 86, 0.6)'
            }]
        }
    });
}

function renderPredictiveAnalytics(data) {
    // Simple linear regression using last 6 months
    const recent = data.slice(-6);
    const x = recent.map((_, i) => i + 1);
    const y = recent.map(d => d.sales);

    const n = x.length;
    const avgX = x.reduce((a, b) => a + b) / n;
    const avgY = y.reduce((a, b) => a + b) / n;
    const slope = x.map((xi, i) => (xi - avgX) * (y[i] - avgY)).reduce((a, b) => a + b) /
        x.map(xi => (xi - avgX) ** 2).reduce((a, b) => a + b);
    const intercept = avgY - slope * avgX;

    const forecast = [n + 1, n + 2, n + 3].map(xf => slope * xf + intercept);
    
    // Create labels for historical data (last 6 months) + forecast (3 months)
    const historicalLabels = recent.map(item => `${item.month} ${item.year}`);
    const forecastLabels = ['Next Month', 'Month +2', 'Month +3'];
    const allLabels = [...historicalLabels, ...forecastLabels];
    
    // Create data array with historical sales + forecasted sales
    const historicalSales = recent.map(d => d.sales);
    const allData = [...historicalSales, ...forecast];

    // Populate Forecast Table (screen reader only) - include both historical and forecast
    const forecastTable = document.getElementById('forecast-table');
    if (forecastTable) {
        const tableRows = [];
        // Add historical data rows
        recent.forEach((item, i) => {
            tableRows.push(`<tr><td>${item.month} ${item.year}</td><td>${item.sales}</td></tr>`);
        });
        // Add forecast data rows
        forecastLabels.forEach((label, i) => {
            tableRows.push(`<tr><td>${label}</td><td>${forecast[i].toFixed(2)}</td></tr>`);
        });
        forecastTable.innerHTML = tableRows.join('');
    }

    new Chart(document.getElementById('forecastChart'), {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Historical Sales',
                    data: historicalSales,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: false
                },
                {
                    label: 'Forecasted Sales',
                    data: [...Array(historicalSales.length).fill(null), ...forecast],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: false,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Sales (Php)'
                    }
                }
            }
        }
    });

    document.getElementById('forecastSummary').textContent = `₱${forecast.map(f => f.toFixed(2)).join(', ₱')}`;
}
