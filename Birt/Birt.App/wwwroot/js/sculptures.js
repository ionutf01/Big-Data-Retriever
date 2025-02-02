import { fetchWithRetry } from './1850-1900.js';
export function getAllSculptures() {
    const dropdown = document.getElementById("queryDropdown");
    const selectedArtist = dropdown.value;
    if (selectedArtist === "famous") {
        getFamousSculptures();
    } else if (selectedArtist === "specific-artist") {
        getSpecificArtistSculptures();
    } else if (selectedArtist === "specific-museum") {
        getSpecificMuseumSculptures();
    } else if (selectedArtist === "specific-museum") {
        getSpecificMaterialSculptures();
    }
}
// Query handling functions
export function handleQuery(event) {
    const queryValue = document.getElementById('queryDropdown').value;
    if (queryValue === 'famous') {
        getAllSculptures();
    } else if (queryValue === 'specific-artist') {
        const artistSelect = document.getElementById('artist');
        if (artistSelect.value) {
            getSpecificArtistSculptures(event);
        }
    } else if (queryValue === 'specific-museum') {
        const artistSelect = document.getElementById('museum');
        if (artistSelect.value) {
            getSpecificMuseumSculptures(event);
        }
    } else if (queryValue === 'specific-material') {
        const artistSelect = document.getElementById('material');
        if (artistSelect.value) {
            getSpecificMaterialSculptures(event);
        }
    }
}
export function toggleCriteriaForm() {
    console.log('toggleCriteriaForm');
    const queryValue = document.getElementById('queryDropdown').value;

    const artistForm = document.getElementById('specificArtistForm');
    const museumForm = document.getElementById('specificMuseumForm');
    const materialForm = document.getElementById('specificMaterialForm');
    const periodForm = document.getElementById('periodForm');

    // Hide all forms by default
    artistForm.style.display = 'none';
    periodForm.style.display = 'none';
    museumForm.style.display = 'none';
    materialForm.style.display = 'none';

    // Show the appropriate form based on selection
    if (queryValue === 'specific-artist') {
        artistForm.style.display = 'block';
    } else if (queryValue === 'specific-museum') {
        museumForm.style.display = 'block';
    } else if (queryValue === 'specific-material') {
        materialForm.style.display = 'block';
    } else if (queryValue === 'period') {
        periodForm.style.display = 'block';
    } else {
        artistForm.style.display = 'none';
    }
}
export async function getFamousSculptures() {
    const query = `
        SELECT ?sculpture ?sculptureLabel ?artist ?artistLabel ?creationDate ?location ?locationLabel ?image WHERE {
            ?sculpture wdt:P31 wd:Q860861 .  # Instance of sculpture
            ?sculpture wdt:P170 ?artist .     # Creator
            OPTIONAL { ?sculpture wdt:P571 ?creationDate . }  # Creation date
            OPTIONAL { ?sculpture wdt:P276 ?location . }      # Location
            OPTIONAL { ?sculpture wdt:P18 ?image . }          # Image
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 50
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    await displaySculptureResults(data);
    
}
export async function getSpecificArtistSculptures(event) {
    event.preventDefault();
    const artist = document.getElementById("artist").value;
    if (!artist) {
        alert("Please select an artist.");
        return;
    }
    
    const query = `
        SELECT ?sculpture ?sculptureLabel ?creationDate ?image WHERE {
            ?sculpture wdt:P31 wd:Q860861 .  # Instance of sculpture
            ?sculpture wdt:P170 wd:${artist} .
            OPTIONAL { ?sculpture wdt:P571 ?creationDate . }  # Creation date
            OPTIONAL { ?sculpture wdt:P18 ?image . }          # Image
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 50
    `;
    console.log("QUERY", query);
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    await displaySculptureResults(data);
}
export async function getSpecificMuseumSculptures(event) {
    event.preventDefault();
    const museum = document.getElementById("museum").value;
    if (!museum) {
        alert("Please select a museum.");
        return;
    }
    
    const query = `
        SELECT ?sculpture ?sculptureLabel ?artist ?artistLabel ?image WHERE {
            ?sculpture wdt:P31 wd:Q860861 .  # Instance of sculpture
            ?sculpture wdt:P276 wd:${museum} . 
            OPTIONAL { ?sculpture wdt:P170 ?artist . }  # Creator
            OPTIONAL { ?sculpture wdt:P18 ?image . }    # Image
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 50
    `;
    console.log("QUERY", query);
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    await displaySculptureResults(data);
}
export async function getSpecificMaterialSculptures(event) {
    event.preventDefault();
    const material = document.getElementById("material").value;
    if (!material) {
        alert("Please select a material.");
        return;
    }
    
    const query = `
        SELECT ?sculpture ?sculptureLabel ?artist ?artistLabel ?material ?materialLabel ?image WHERE {
            ?sculpture wdt:P31 wd:Q860861 .  # Instance of sculpture
            ?sculpture wdt:P186 wd:${material} .
            OPTIONAL { ?sculpture wdt:P170 ?artist . }  # Creator
            OPTIONAL { ?sculpture wdt:P18 ?image . }    # Image
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 50
    `;
    console.log("QUERY", query);
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    await displaySculptureResults(data);
}
async function displaySculptureResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Add headers for the table
    const headerRow = document.createElement('tr');
    const headers = ['Image', 'Title', 'Creation Date'];
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        header.style.border = '1px solid #ddd';
        header.style.padding = '8px';
        header.style.textAlign = 'left';
        header.style.backgroundColor = '#f2f2f2';
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);

    const titlesSet = new Set();

    if (data.results.bindings.length === 0) {
        const noResultsRow = document.createElement('tr');
        const noResultsCell = document.createElement('td');
        noResultsCell.colSpan = headers.length;
        noResultsCell.textContent = 'No results found.';
        noResultsCell.style.textAlign = 'center';
        noResultsCell.style.padding = '8px';
        noResultsRow.appendChild(noResultsCell);
        table.appendChild(noResultsRow);
    } else {
        data.results.bindings.forEach(item => {
            if (item.image) {
                const title = item.sculptureLabel.value;
                if (!titlesSet.has(title)) {
                    titlesSet.add(title);

                    const row = document.createElement('tr');

                    // Image column
                    const imgCell = document.createElement('td');
                    imgCell.style.border = '1px solid #ddd';
                    imgCell.style.padding = '8px';
                    const img = document.createElement('img');
                    img.src = item.image.value;
                    img.alt = title;
                    img.width = 100;
                    img.height = 100;
                    img.loading = 'lazy';
                    img.style.cursor = 'pointer';
                    img.addEventListener('click', () => {
                        openModal(img.src, img.alt);
                    });
                    imgCell.appendChild(img);
                    row.appendChild(imgCell);

                    // Title column
                    const titleCell = document.createElement('td');
                    titleCell.style.border = '1px solid #ddd';
                    titleCell.style.padding = '8px';
                    const link = document.createElement('a');
                    const sculptureId = item.sculpture.value.split('/').pop();
                    link.href = `https://www.wikidata.org/wiki/${sculptureId}`;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.textContent = title;
                    titleCell.appendChild(link);
                    row.appendChild(titleCell);

                    // Creation Date column
                    const creationDateCell = document.createElement('td');
                    creationDateCell.style.border = '1px solid #ddd';
                    creationDateCell.style.padding = '8px';
                    creationDateCell.textContent = item.creationDate ? item.creationDate.value : 'N/A';
                    row.appendChild(creationDateCell);

                    table.appendChild(row);
                }
            }
        });
    }

    resultsContainer.appendChild(table);
}
export function openModal(src, alt) {
    const modal = document.getElementById('myModal');
    const modalImg = document.getElementById('img01');
    const captionText = document.getElementById('caption');
    modal.style.display = 'block';
    modalImg.src = src;
    captionText.innerHTML = alt;

    const span = document.getElementsByClassName('close')[0];
    span.onclick = function() {
        closeModal();
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }
}
export function closeModal() {
    const modal = document.getElementById('myModal');
    modal.classList.add('fade-out');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('fade-out');
    }, 600); // Match the duration of the fade-out animation
}
export function exportTableToCSV(filename) {
    const csv = [];
    const rows = document.querySelectorAll("#results table tr");

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
export function exportTableToHTML(filename) {
    const table = document.querySelector("#results table").outerHTML;
    const htmlFile = new Blob([table], { type: "text/html" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(htmlFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
export async function getSculpturesByPeriod(startDate, endDate) {
    const endpointUrl = "https://query.wikidata.org/sparql";

    const sparqlQuery = `
    SELECT DISTINCT ?sculpture ?sculptureLabel ?artist ?artistLabel ?inception ?image WHERE {
      ?sculpture wdt:P31 wd:Q860861.  # Instance of sculpture
      ?sculpture wdt:P170 ?artist.    # Has artist
      ?sculpture wdt:P571 ?inception. # Inception date
      ?sculpture wdt:P18 ?image.      # Must have an image
    
      # Ensure sculpture and artist have English labels
      ?sculpture rdfs:label ?sculptureLabel. 
      FILTER(LANG(?sculptureLabel) = "en")  
    
      ?artist rdfs:label ?artistLabel.  # Ensure artist has a name
      FILTER(LANG(?artistLabel) = "en") 
    
      FILTER (?inception >= "${startDate}T00:00:00Z"^^xsd:dateTime &&
              ?inception <= "${endDate}T23:59:59Z"^^xsd:dateTime)
    
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY ?inception
    LIMIT 50
    `;

    console.log("QUERY", sparqlQuery);
    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}&format=json`;

    document.getElementById("loading").style.display = "block";

    try {
        const response = await fetch(url, {
            headers: { "Accept": "application/sparql-results+json" }
        });
        const data = await response.json();

        const filteredResults = data.results.bindings.filter(item => item.image);
        displayResults(filteredResults);
    } catch (error) {
        console.error("Error fetching sculptures:", error);
    } finally {
        document.getElementById("loading").style.display = "none";
    }
}
function displayResults(results) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    const validResults = results.filter(item => item.sculptureLabel?.value && item.artistLabel?.value);

    if (validResults.length === 0) {
        resultsContainer.innerHTML = "<p>No sculptures found for the selected period.</p>";
        return;
    }

    // Create a table
    const table = document.createElement("table");
    table.classList.add("table", "table-striped");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Name</th>
                <th>Artist</th>
                <th>Inception Year</th>
                <th>Image</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector("tbody");

    validResults.forEach(item => {
        const row = document.createElement("tr");

        const sculptureLabel = item.sculptureLabel.value;
        const artistLabel = item.artistLabel.value;
        const inception = item.inception.value.split("T")[0]; 
        const imageUrl = item.image.value;

        row.innerHTML = `
            <td>${sculptureLabel}</td>
            <td>${artistLabel}</td>
            <td>${inception}</td>
            <td><img src="${imageUrl}" width="100" alt="${sculptureLabel}" style="cursor: pointer;"></td>
        `;

        // Add click event listener to the image for opening the modal
        const imgElement = row.querySelector("img");
        imgElement.addEventListener("click", () => {
            openModal(imageUrl, sculptureLabel);
        });

        tbody.appendChild(row);
    });
    
    resultsContainer.appendChild(table);
    loadingIndicator.style.display = 'none';
}