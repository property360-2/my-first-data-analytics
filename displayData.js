async function displayDataTable(url, containerId) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        const container = document.getElementById(containerId);
        container.innerHTML = ""; // clear first

        for (const [section, rows] of Object.entries(data)) {
            // Section Title
            const title = document.createElement('h3');
            title.textContent = section;
            title.classList.add('text-lg', 'font-semibold', 'mb-2', 'mt-4');
            container.prepend
                ? container.prepend(title)
                : container.innerHTML += `<h3 class="text-lg font-semibold mb-2 mt-4">${section}</h3>`;

            // Create table
            const table = document.createElement('table');
            table.classList.add('min-w-full', 'border', 'border-gray-400', 'mb-4');

            // Header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    ${Object.keys(rows[0]).map(key => `<th class="border px-4 py-2 font-semibold">${key}</th>`).join('')}
                </tr>`;
            table.appendChild(thead);

            // Body
            const tbody = document.createElement('tbody');
            for (const row of rows) {
                tbody.innerHTML += `
                    <tr>
                        ${Object.values(row).map(val => `<td class="border px-4 py-2">${val}</td>`).join('')}
                    </tr>`;
            }
            table.appendChild(tbody);
            container.appendChild(table);
        }
    } catch (error) {
        console.error('Error fetching or displaying data', error);
    }
}

// Call this after the page has loaded
document.addEventListener('DOMContentLoaded', () => {
    displayDataTable("./sales_data.json", "data-table");
});
