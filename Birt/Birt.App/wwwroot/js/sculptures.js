export function getAllSculpturesOptions() {
    const dropdown = document.getElementById("queryDropdown");
    const selectedOption = dropdown.value;
    const locationLabel = document.getElementById("locationLabel").value;
    if (selectedOption === "sculptors") {
        getSculptorsFromRo(locationLabel);
    } 
}
export async function getSculptorsFromRo(locationLabel) {
    const query = `
        SELECT DISTINCT ?sculptorLabel ?creationLabel ?locationLabel ?image WHERE {
          ?sculptor wdt:P106 wd:Q1281618 .  # occupation: sculptor
          ?sculptor wdt:P27 wd:Q218 .  # country of citizenship: Romania
          ?creation wdt:P170 ?sculptor .  # creator
          ?creation wdt:P276 ?location .  # located in
          ?creation wdt:P18 ?image .  # image
          ?creation wdt:P31 wd:Q860861 .  # instance of: sculpture
          FILTER(?location != wd:Q218 && !EXISTS { ?location wdt:P17 wd:Q218 }) 
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    displaySculptureResults(data);
}
export async function displaySculptureResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    table.style.fontFamily = 'Arial, sans-serif';

    const headerRow = document.createElement('tr');
    const headers = ['Sculptor', 'Creation', 'Location', 'Image'];
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        header.style.border = '1px solid #ddd';
        header.style.padding = '12px';
        header.style.textAlign = 'left';
        header.style.backgroundColor = '#f2f2f2';
        header.style.fontWeight = 'bold';
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);

    const uniqueCreations = new Set();

    for (const item of data.results.bindings) {
        const creationLabel = item.creationLabel ? item.creationLabel.value : 'Unknown';
        if (uniqueCreations.has(creationLabel)) {
            continue; // Skip duplicate creation
        }
        uniqueCreations.add(creationLabel);

        const row = document.createElement('tr');
        row.style.backgroundColor = '#f9f9f9';
        row.onmouseover = () => row.style.backgroundColor = '#f1f1f1';
        row.onmouseout = () => row.style.backgroundColor = '#f9f9f9';

        const sculptorCell = document.createElement('td');
        sculptorCell.style.border = '1px solid #ddd';
        sculptorCell.style.padding = '12px';
        sculptorCell.textContent = item.sculptorLabel ? item.sculptorLabel.value : 'Unknown';
        row.appendChild(sculptorCell);

        const creationCell = document.createElement('td');
        creationCell.style.border = '1px solid #ddd';
        creationCell.style.padding = '12px';
        creationCell.textContent = creationLabel;
        row.appendChild(creationCell);

        const locationCell = document.createElement('td');
        locationCell.style.border = '1px solid #ddd';
        locationCell.style.padding = '12px';
        locationCell.textContent = item.locationLabel ? item.locationLabel.value : 'Unknown';
        row.appendChild(locationCell);

        const imageCell = document.createElement('td');
        imageCell.style.border = '1px solid #ddd';
        imageCell.style.padding = '12px';
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image.value;
            img.alt = creationLabel;
            img.width = 100;
            img.height = 100;
            img.loading = 'lazy';
            imageCell.appendChild(img);
        } else {
            imageCell.textContent = 'No image available';
        }
        row.appendChild(imageCell);

        table.appendChild(row);
    }

    resultsContainer.appendChild(table);
}

export async function getBrancusiWorks() {
    const query = `
        SELECT DISTINCT ?workLabel ?locationLabel WHERE {
          ?work wdt:P170 wd:Q153048 .  # creator: Constantin Brancusi
          ?work wdt:P276 ?location .  # located in
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        ORDER BY ?workLabel
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    displayBrancusiWorks(data);
}

export async function displayBrancusiWorks(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    table.style.fontFamily = 'Arial, sans-serif';

    const headerRow = document.createElement('tr');
    const headers = ['Work', 'Location'];
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        header.style.border = '1px solid #ddd';
        header.style.padding = '12px';
        header.style.textAlign = 'left';
        header.style.backgroundColor = '#f2f2f2';
        header.style.fontWeight = 'bold';
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);

    for (const item of data.results.bindings) {
        const row = document.createElement('tr');
        row.style.backgroundColor = '#f9f9f9';
        row.onmouseover = () => row.style.backgroundColor = '#f1f1f1';
        row.onmouseout = () => row.style.backgroundColor = '#f9f9f9';

        const workCell = document.createElement('td');
        workCell.style.border = '1px solid #ddd';
        workCell.style.padding = '12px';
        workCell.textContent = item.workLabel ? item.workLabel.value : 'Unknown';
        row.appendChild(workCell);

        const locationCell = document.createElement('td');
        locationCell.style.border = '1px solid #ddd';
        locationCell.style.padding = '12px';
        locationCell.textContent = item.locationLabel ? item.locationLabel.value : 'Unknown';
        row.appendChild(locationCell);

        table.appendChild(row);
    }

    resultsContainer.appendChild(table);
}
export function toggleCriteriaForm() {
    console.log('toggleCriteriaForm');
    const queryValue = document.getElementById('queryDropdown').value;
    const criteriaForm = document.getElementById('criteria-form');
}

export function handleQuery() {
    console.log('handleQuery');
    const queryValue = document.getElementById('queryDropdown').value;
    console.log(queryValue);
    if (!queryValue) {
        alert("Please select a query before searching.");
        return;
    }
}