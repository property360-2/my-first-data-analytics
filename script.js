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
    const labels = ['Next Month', 'Month +2', 'Month +3'];

    new Chart(document.getElementById('forecastChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Forecasted Sales',
                data: forecast,
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            }]
        }
    });

    document.getElementById('forecastSummary').textContent = `₱${forecast.map(f => f.toFixed(2)).join(', ₱')}`;

}
