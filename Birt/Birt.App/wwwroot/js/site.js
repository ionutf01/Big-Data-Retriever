﻿/* Works of art by Vincent van Gogh (Q5582) */

async function getWorksOfArtGogh() {
    const query = `
        SELECT DISTINCT ?work ?workLabel ?workImage ?artist ?artistLabel ?museum ?museumLabel WHERE {
          ?work wdt:P170 wd:Q5582.  
          OPTIONAL { ?work wdt:P18 ?workImage. }
          OPTIONAL { ?work wdt:P170 ?artist. }
          OPTIONAL { ?work wdt:P276 ?museum. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 20
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    displayResultsPaintings(data);
}

/*
* Works of art by Leonardo da Vinci (Q762)
* */
async function getWorksOfArtDaVinci() {
    const query = `
        SELECT DISTINCT ?work ?workLabel ?workImage ?artist ?artistLabel ?museum ?museumLabel WHERE {
            ?work wdt:P170 wd:Q762.  # Created by Claude Monet (Q762)
            OPTIONAL { ?work wdt:P18 ?workImage. }  # Optional: image of the painting
            OPTIONAL { ?work wdt:P170 ?artist. }    # Optional: artist of the painting
            OPTIONAL { ?work wdt:P276 ?museum. }    # Optional: museum where the painting is located
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 20
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    displayResultsPaintings(data);
}

/*
* Paintings influenced by Gogh
* */

async function displayTopPaintingsInfluencedByGogh() {
    const paintersQuery = `
        PREFIX icon: <http://www.iconontology.org/ontology#>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>

        SELECT ?artist ?artistLabel WHERE {
            ?artist wdt:P737 wd:Q5582.  # Influenced by Vincent van Gogh (Q5582)
            ?artist wdt:P106 wd:Q1028181.  # Occupation: painter
            ?artist wdt:P31 wd:Q5.         # Instance of: human
            OPTIONAL { ?artist icon:hasInfluence ?influenceDescription. }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
    `;
    const paintersUrl = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(paintersQuery);
    const paintersResponse = await fetch(paintersUrl, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const paintersData = await paintersResponse.json();

    let allPaintingsData = { results: { bindings: [] } };

    for (const painter of paintersData.results.bindings) {
        const painterId = painter.artist.value.split('/').pop();
        const paintingsQuery = `
            SELECT ?work ?workLabel ?workImage WHERE {
                ?work wdt:P170 wd:${painterId}.  # Created by the painter
                ?work wdt:P31 wd:Q3305213.  # Instance of painting (Q3305213)
                OPTIONAL { ?work wdt:P18 ?workImage. }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            LIMIT 3
        `;
        const paintingsUrl = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(paintingsQuery);
        const paintingsResponse = await fetch(paintingsUrl, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        });
        const paintingsData = await paintingsResponse.json();

        // Add artistLabel and influenceDescription to each painting
        paintingsData.results.bindings.forEach(painting => {
            painting.artistLabel = painter.artistLabel;
            painting.artist = painter.artist;
            painting.influenceDescription = painter.influenceDescription;
        });

        allPaintingsData.results.bindings.push(...paintingsData.results.bindings);
    }

    displayResults(allPaintingsData);
}

/*
* Similar artists' logic
* */
export async function compareArtists(artist1Id, artist2Id) {
    console.log("compare artists")
    const getArtistNameQuery = artistId => `
        SELECT ?artistLabel WHERE {
            wd:${artistId} rdfs:label ?artistLabel.
            FILTER(LANG(?artistLabel) = "en").
        }
    `;
    const fetchArtistName = async artistId => {
        const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(getArtistNameQuery(artistId));
        const response = await fetch(url, {
            headers: { 'Accept': 'application/sparql-results+json' }
        });
        const data = await response.json();
        return data.results.bindings[0]?.artistLabel?.value || "Unknown Artist";
    };

    const artist1Name = await fetchArtistName(artist1Id);
    const artist2Name = await fetchArtistName(artist2Id);

    const query = `
        SELECT DISTINCT ?property ?propertyLabel ?artist1Value ?artist1ValueLabel ?artist2Value ?artist2ValueLabel WHERE {
            # Proprietăți și valori pentru artistul 1
            OPTIONAL {
                wd:${artist1Id} ?property ?artist1Value.
                FILTER(?artist1Value != "" && ?artist1Value != "N/A").
            }
            # Proprietăți și valori pentru artistul 2
            OPTIONAL {
                wd:${artist2Id} ?property ?artist2Value.
                FILTER(?artist2Value != "" && ?artist2Value != "N/A").
            }
            # Adăugare etichete pentru proprietăți și valori
            SERVICE wikibase:label { 
                bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
                ?property rdfs:label ?propertyLabel.
                ?artist1Value rdfs:label ?artist1ValueLabel.
                ?artist2Value rdfs:label ?artist2ValueLabel.
            }
            # Filtru pe proprietăți relevante
            FILTER(?property IN (wdt:P135, wdt:P106, wdt:P569, wdt:P570, wdt:P27, wdt:P19, wdt:P20, wdt:P18, wdt:P800, wdt:P937)) # Mișcare, profesie, naștere, deces
        }
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    displayComparison(data, artist1Name, artist2Name);
}
function addStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        #results ul {
            list-style-type: none; /* Elimină punctele din listă */
            padding: 0;
        }

        #results li {
            display: flex;
            justify-content: space-between; /* Aliniază textul și butonul pe aceeași linie */
            align-items: center;
            padding: 5px 0;
            width: 250px; /* Dimensiune fixă pentru uniformizare */
        }

        #results button {
            margin-left: 10px; /* Adaugă spațiu între nume și buton */
            padding: 3px 8px;
            font-size: 14px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        #results button:hover {
            background-color: #0056b3;
        }
    `;
    document.head.appendChild(style);
}

addStyles();

function displaySimilarArtistsVinci(data) {
    console.log("DATA IN SIMILAR VINCI", data);
    const resultsContainer = document.getElementById('results');

    let list = resultsContainer.querySelector('ul');
    if (!list) {
        list = document.createElement('ul');
        resultsContainer.appendChild(list);
    } else {
        list.innerHTML = ''; // Clear existing list items
    }

    data.results.bindings.forEach(item => {
        const listItem = document.createElement('li');

        // Creează un div pentru artist
        const artistSpan = document.createElement('span');
        artistSpan.textContent = item.artistLabel.value;

        const artistId = item.artist.value.split('/').pop();

        // Creează butonul "Compare"
        const compareButton = document.createElement('button');
        compareButton.textContent = 'Compare';
        compareButton.addEventListener('click', () => {
            compareArtists('Q762', artistId);
        });

        // Adaugă artistul și butonul în listItem
        listItem.appendChild(artistSpan);
        listItem.appendChild(compareButton);

        list.appendChild(listItem);
    });
}


export function displaySimilarArtistsGogh(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<h2>Similar Artists</h2>';

    const list = document.createElement('ul');

    data.results.bindings.forEach(item => {
        const listItem = document.createElement('li');
        const artistName = item.artistLabel.value;
        const artistId = item.artist.value.split('/').pop();

        const compareButton = document.createElement('button');
        compareButton.textContent = 'Compare';

        compareButton.addEventListener('click', () => {
            compareArtists('Q5582', artistId); 
        });

        listItem.textContent = artistName;
        listItem.appendChild(compareButton);

        list.appendChild(listItem);
    });

    resultsContainer.appendChild(list);
}

async function fetchSimilarArtists(artistId) {
    const movement = document.getElementById('movement').value;
    const notMovement = document.getElementById('not_movement').checked;

    const occupation = document.getElementById('occupation').value;
    const notOccupation = document.getElementById('not_occupation').checked;
    const country = document.getElementById('country').value;
    let filters = [];

    if (movement) {
        filters.push(`?artist wdt:P135 ?movement.`);
        if (notMovement) {
            filters.push(`FILTER(?movement != wd:${movement}).`);
        } else {
            filters.push(`FILTER(?movement = wd:${movement}).`);
        }
    }

    if (occupation) {
        filters.push(`?artist wdt:P106 ?occupation.`);
        if (notOccupation) {
            filters.push(`FILTER(?occupation != wd:${occupation}).`);
        } else {
            filters.push(`FILTER(?occupation = wd:${occupation}).`);
        }
    }


    if (country) {
        filters.push(`?artist wdt:P27 wd:${country}.`);
    }


    filters.push(`FILTER(?artist != wd:${artistId}).`);

    if (filters.length === 0) {
        alert("Please select at least one criterion.");
        return;
    }

    const query = `
        SELECT DISTINCT ?artist ?artistLabel WHERE {
            ${filters.join('\n')}
            SERVICE wikibase:label { 
                bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". 
            }
        }
        LIMIT 15
    `;
    console.log(query);
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "";
    const data = await response.json();
    data.results.bindings = data.results.bindings.filter(artist => {
        const label = artist.artistLabel ? artist.artistLabel.value : "";
        return !/\d/.test(label);  
    });
    console.log(data);
    if (data.results.bindings.length === 0) {
        resultsContainer.innerHTML = "<li>No similar artists found.</li>";
        console.log("No similar artists found");
        return;
    }

    if (artistId === 'Q762') {
        displaySimilarArtistsVinci(data);
    } else if (artistId === 'Q5582') {
        displaySimilarArtistsGogh(data);
    }
}

export async function displayComparison(data, artist1Name, artist2Name) {
    addComparisonStyles(); // Adaugă stilurile CSS

    const comparisonContainer = document.getElementById('comparison');
    comparisonContainer.innerHTML = `<h2>Comparison: ${artist1Name} vs. ${artist2Name}</h2>`;

    const table = document.createElement('table');
    table.classList.add('comparison-table');

    table.innerHTML = `
        <thead>
            <tr>
                <th>Property</th>
                <th>${artist1Name}</th>
                <th>${artist2Name}</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    const groupedData = {};

    for (const item of data.results.bindings) {
        const propertyUri = item.property.value;
        const propertyItself = propertyUri.split('/').pop();
        const propertyLabel = await fetchMessage(propertyItself);
        const cleanProperty = propertyLabel.split('@')[0].replace('{"object":"', '').replace('"}', '').replace('[', '');

        const artist1Value = item.artist1ValueLabel ? item.artist1ValueLabel.value :
            (item.artist1Value ? item.artist1Value.value : "N/A");
        const artist2Value = item.artist2ValueLabel ? item.artist2ValueLabel.value :
            (item.artist2Value ? item.artist2Value.value : "N/A");

        if (!groupedData[cleanProperty]) {
            groupedData[cleanProperty] = { artist1: new Set(), artist2: new Set() };
        }
        if (artist1Value !== "N/A") groupedData[cleanProperty].artist1.add(artist1Value);
        if (artist2Value !== "N/A") groupedData[cleanProperty].artist2.add(artist2Value);
    }

    for (const [property, values] of Object.entries(groupedData)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${property}</td>
            <td>${Array.from(values.artist1).map(value => `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(value)}" target="_blank" rel="noopener noreferrer">${value}</a>`).join(", ")}</td>
            <td>${Array.from(values.artist2).map(value => `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(value)}" target="_blank" rel="noopener noreferrer">${value}</a>`).join(", ")}</td>
        `;
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    comparisonContainer.appendChild(table);
}

// Funcție pentru adăugarea stilurilor CSS dinamic în JavaScript
function addComparisonStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .comparison-table th, .comparison-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .comparison-table th {
            background-color: #f4f4f4;
            font-weight: bold;
        }

        .comparison-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .comparison-table a {
            text-decoration: none;
            color: #0073e6;
        }

        .comparison-table a:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);
}



/*
* Artists influenced by Van Gogh
* */

async function fetchArtistsInfluencedByVanGogh(notableWork = '') {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator

    let query = `
        PREFIX icon: <http://www.iconontology.org/ontology#>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT DISTINCT ?artist ?artistLabel ?work ?workLabel ?workImage WHERE {
            ?artist wdt:P737 wd:Q5582.  # Influenced by Van Gogh (Q5582)
            ?artist wdt:P106 wd:Q1028181.  # Occupation: painter
            OPTIONAL {
                ?work wdt:P170 ?artist.
                ?work rdfs:label ?workLabel.
                OPTIONAL { ?work wdt:P18 ?workImage. }
            }
            OPTIONAL {
                ?artist icon:hasInfluence ?influence.
                ?influence rdfs:label ?influenceLabel.
            }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
    `;

    if (notableWork) {
        query += `FILTER(CONTAINS(LCASE(?workLabel), LCASE("${notableWork}")))`;
    }

    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();
    displayArtistsInfluencedByVanGogh(data);
}
function displayArtistsInfluencedByVanGogh(data) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'none'; // Hide loading indicator
    const container = document.getElementById('results');
    container.innerHTML = ''; // Clear previous results

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Add headers for the table
    const headerRow = document.createElement('tr');
    const headers = ['Artist', 'Work', 'Image'];
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

    const addedArtists = new Set();

    data.results.bindings.forEach(item => {
        const artist = item.artistLabel.value;
        const artistId = item.artist.value.split('/').pop();
        const work = item.workLabel ? item.workLabel.value : 'N/A';
        const workId = item.work ? item.work.value.split('/').pop() : null;
        const workImage = item.workImage ? item.workImage.value : 'N/A';

        // Skip rows with any column containing "N/A" or duplicate artists
        if (artist === 'N/A' || work === 'N/A' || workImage === 'N/A' || addedArtists.has(artist)) {
            return;
        }

        addedArtists.add(artist);

        const row = document.createElement('tr');

        // Artist column
        const artistCell = document.createElement('td');
        artistCell.style.border = '1px solid #ddd';
        artistCell.style.padding = '8px';
        const artistLink = document.createElement('a');
        artistLink.href = `https://www.wikidata.org/wiki/${artistId}`;
        artistLink.target = '_blank';
        artistLink.rel = 'noopener noreferrer';
        artistLink.textContent = artist;
        artistCell.appendChild(artistLink);
        row.appendChild(artistCell);

        // Work column
        const workCell = document.createElement('td');
        workCell.style.border = '1px solid #ddd';
        workCell.style.padding = '8px';
        if (workId) {
            const workLink = document.createElement('a');
            workLink.href = `https://www.wikidata.org/wiki/${workId}`;
            workLink.target = '_blank';
            workLink.rel = 'noopener noreferrer';
            workLink.textContent = work;
            workCell.appendChild(workLink);
        } else {
            workCell.textContent = work;
        }
        row.appendChild(workCell);

        // Image column
        const imgCell = document.createElement('td');
        imgCell.style.border = '1px solid #ddd';
        imgCell.style.padding = '8px';
        const img = document.createElement('img');
        img.src = workImage;
        img.alt = work;
        img.width = 100;
        img.height = 100;
        img.loading = 'lazy';
        img.style.cursor = 'pointer'; // Change cursor to pointer
        img.addEventListener('click', () => {
            openModal(img.src, img.alt); // Open the modal with the clicked image
        });
        imgCell.appendChild(img);
        row.appendChild(imgCell);

        table.appendChild(row);
    });

    // loadingIndicator.style.display = 'none'; // Hide loading indicator
    document.getElementById("exportCsv").style.display = 'inline-block';
    document.getElementById("exportHtml").style.display = 'inline-block';
    container.appendChild(table);
}

/*
* Painting influences between 1850 and 1900
* */

async function fetchLabel(wikidataId) {
    const query = `
        SELECT ?label WHERE {
            wd:${wikidataId} rdfs:label ?label.
            FILTER(LANG(?label) = "en").
        }
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: { 'Accept': 'application/sparql-results+json' }
    });
    const data = await response.json();
    return data.results.bindings[0]?.label?.value || wikidataId;
}
function displayResults(data) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    const headers = ['Image', 'Title', 'Painter'];
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

    data.results.bindings.forEach(item => {
        if (item.workLabel && item.workLabel.value.includes("Q") || !item.workImage || !item.workImage.value) {
            return; // Skip results containing "Q<some_number>" or without an image
        }

        const row = document.createElement('tr');

        const imgCell = document.createElement('td');
        imgCell.style.border = '1px solid #ddd';
        imgCell.style.padding = '8px';
        const img = document.createElement('img');
        img.src = item.workImage.value;
        img.alt = item.workLabel ? item.workLabel.value : 'Image';
        img.width = 100;
        img.height = 100;
        img.loading = 'lazy';
        img.style.cursor = 'pointer'; // Change cursor to pointer
        img.addEventListener('click', () => {
            openModal(img.src, img.alt); // Open the modal with the clicked image
        });
        imgCell.appendChild(img);
        row.appendChild(imgCell);

        const titleCell = document.createElement('td');
        titleCell.style.border = '1px solid #ddd';
        titleCell.style.padding = '8px';
        const link = document.createElement('a');
        const workId = item.work.value.split('/').pop();
        link.href = `https://www.wikidata.org/wiki/${workId}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.workLabel ? item.workLabel.value : 'Unknown';
        titleCell.appendChild(link);
        row.appendChild(titleCell);

        const painterCell = document.createElement('td');
        painterCell.style.border = '1px solid #ddd';
        painterCell.style.padding = '8px';
        const painterLink = document.createElement('a');
        const painterId = item.artist.value.split('/').pop();
        painterLink.href = `https://www.wikidata.org/wiki/${painterId}`;
        painterLink.target = '_blank';
        painterLink.rel = 'noopener noreferrer';
        painterLink.textContent = item.artistLabel ? item.artistLabel.value : 'Unknown';
        painterCell.appendChild(painterLink);
        row.appendChild(painterCell);

        table.appendChild(row);
    });

    loadingIndicator.style.display = 'none'; // Hide loading indicator
    document.getElementById("exportCsv").style.display = 'inline-block';
    document.getElementById("exportHtml").style.display = 'inline-block';
    resultsContainer.appendChild(table);
}
async function displayInfluencedByGogh() {
    const artistsQuery = `
        SELECT DISTINCT ?artist ?artistLabel WHERE {
            ?artist wdt:P737 wd:Q5582.  # Influenced by Van Gogh (Q5582)
            ?artist wdt:P106 wd:Q1028181.  # Occupation: painter
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
    `;
    const artistsUrl = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(artistsQuery);
    try {
        const artistsResponse = await fetch(artistsUrl, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        });
        if (!artistsResponse.ok) {
            throw new Error(`Network response was not ok: ${artistsResponse.statusText}`);
        }
        const artistsData = await artistsResponse.json();
        if (artistsData.results.bindings.length === 0) {
            console.warn('No artists found for the query.');
            return;
        }

        let allPaintingsData = { results: { bindings: [] } };

        for (const artist of artistsData.results.bindings) {
            const artistId = artist.artist.value.split('/').pop();
            const paintingsQuery = `
                SELECT ?work ?workLabel ?workImage WHERE {
                    ?work wdt:P170 wd:${artistId}.  # Created by the artist
                    ?work wdt:P31 wd:Q3305213.  # Instance of painting (Q3305213)
                    OPTIONAL { ?work wdt:P18 ?workImage. }
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
                }
                LIMIT 1
            `;
            const paintingsUrl = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(paintingsQuery);
            const paintingsResponse = await fetch(paintingsUrl, {
                headers: {
                    'Accept': 'application/sparql-results+json'
                }
            });
            const paintingsData = await paintingsResponse.json();

            // Add artistLabel to each painting
            paintingsData.results.bindings.forEach(painting => {
                painting.artistLabel = artist.artistLabel;
                painting.artist = artist.artist;
            });

            allPaintingsData.results.bindings.push(...paintingsData.results.bindings);
        }

        displayResults(allPaintingsData);
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}
async function fetchMessage(property) {
    const response = await fetch('http://localhost:5242/rdf/' + property);
    if (response.ok) {
        const message = await response.text();
        console.log(message); // Output the message to the console
        return message;
        // You can also update the DOM or perform other actions with the message
    }
}
let isTableView = true; // Variabilă globală pentru a urmări starea vizualizării
// let lastData = null; // Stochează ultima interogare

window.toggleView = function () {
    console.log("Toggling view..."); // Debugging
    isTableView = !isTableView;
    document.getElementById("toggleView").textContent = isTableView ? "See Cards" : "See Table";

    if (lastData) {
        displayResultsPaintings(lastData);
    }
};

window.displayResultsPaintings = function (data) {
    lastData = data;
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Curățare anterioară

    if (isTableView) {
        console.log("Displaying table..."); // Debugging
        displayTable(data, resultsContainer);
    } else {
        console.log("Displaying cards..."); // Debugging
        displayCards(data);
    }
};

let lastData = null; // Variabilă pentru a stoca ultima interogare de date

function displayResultsPaintings(data) {
    lastData = data; // Stocăm datele pentru a le reutiliza la schimbarea vizualizării

    // add loading spinner
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; 
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Curăță rezultatele anterioare
    loadingIndicator.style.display = 'none'; 
    if (isTableView) {
        displayTable(data, resultsContainer);
    } else {
        displayCards(data, resultsContainer);
    }
}

function displayTable(data, container) {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    console.log("Appending table to container:", container);
    // Antet tabel
    const headerRow = document.createElement('tr');
    const headers = ['Image', 'Title', 'Painter', 'Museum'];
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

    data.results.bindings.forEach(item => {
        if (!item.workImage || !item.workImage.value) return;

        const row = document.createElement('tr');

        // Coloana Imagine
        const imgCell = document.createElement('td');
        imgCell.style.border = '1px solid #ddd';
        imgCell.style.padding = '8px';
        const img = document.createElement('img');
        img.src = item.workImage.value;
        img.alt = item.workLabel ? item.workLabel.value : 'Image';
        img.width = 100;
        img.height = 100;
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => openModal(img.src, img.alt));
        imgCell.appendChild(img);
        row.appendChild(imgCell);

        // Coloana Titlu
        const titleCell = document.createElement('td');
        titleCell.style.border = '1px solid #ddd';
        titleCell.style.padding = '8px';
        const link = document.createElement('a');
        const workId = item.work.value.split('/').pop();
        link.href = `https://www.wikidata.org/wiki/${workId}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.workLabel ? item.workLabel.value : 'Unknown';
        titleCell.appendChild(link);
        row.appendChild(titleCell);

        // Coloana Pictor
        const painterCell = document.createElement('td');
        painterCell.style.border = '1px solid #ddd';
        painterCell.style.padding = '8px';
        const painterLink = document.createElement('a');
        const painterId = item.artist.value.split('/').pop();
        painterLink.href = `https://www.wikidata.org/wiki/${painterId}`;
        painterLink.target = '_blank';
        painterLink.rel = 'noopener noreferrer';
        painterLink.textContent = item.artistLabel ? item.artistLabel.value : 'Unknown';
        painterCell.appendChild(painterLink);
        row.appendChild(painterCell);

        // Coloana Muzeu
        const museumCell = document.createElement('td');
        museumCell.style.border = '1px solid #ddd';
        museumCell.style.padding = '8px';
        if (item.museum && item.museumLabel) {
            const museumLink = document.createElement('a');
            const museumId = item.museum.value.split('/').pop();
            museumLink.href = `https://www.wikidata.org/wiki/${museumId}`;
            museumLink.target = '_blank';
            museumLink.rel = 'noopener noreferrer';
            museumLink.textContent = item.museumLabel.value;
            museumCell.appendChild(museumLink);
        } else {
            museumCell.textContent = 'N/A';
        }
        row.appendChild(museumCell);

        table.appendChild(row);
    });

    container.appendChild(table);
    document.getElementById("exportCsv").style.display = 'inline-block';
    document.getElementById("exportHtml").style.display = 'inline-block';
}

function displayCards(data) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator
    console.log("DATA IN DISPLAY CARDS", data);
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Curăță rezultatele anterioare
    console.log("resultsContainer", resultsContainer);
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    grid.style.gap = '16px';

    data.results.bindings.forEach(item => {
        if (!item.workImage || !item.workImage.value) return;

        const card = document.createElement('div');
        card.style.border = '1px solid #ddd';
        card.style.borderRadius = '8px';
        card.style.overflow = 'hidden';
        card.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        card.style.padding = '16px';
        card.style.backgroundColor = '#fff';
        card.style.textAlign = 'center';

        // Imaginea
        const img = document.createElement('img');
        img.src = item.workImage.value;
        img.alt = item.workLabel ? item.workLabel.value : 'Image';
        img.style.width = '100%';
        img.style.height = '200px';
        img.style.objectFit = 'cover';
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => openModal(img.src, img.alt));
        card.appendChild(img);

        // Titlu
        const title = document.createElement('h3');
        title.style.margin = '10px 0';
        const link = document.createElement('a');
        const workId = item.work.value.split('/').pop();
        link.href = `https://www.wikidata.org/wiki/${workId}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.workLabel ? item.workLabel.value : 'Unknown';
        link.style.color = '#007bff';
        link.style.textDecoration = 'none';
        title.appendChild(link);
        card.appendChild(title);

        // Pictor
        const painter = document.createElement('p');
        const painterLink = document.createElement('a');
        const painterId = item.artist.value.split('/').pop();
        painterLink.href = `https://www.wikidata.org/wiki/${painterId}`;
        painterLink.target = '_blank';
        painterLink.rel = 'noopener noreferrer';
        painterLink.textContent = item.artistLabel ? item.artistLabel.value : 'Unknown';
        painter.appendChild(document.createTextNode('Painter: '));
        painter.appendChild(painterLink);
        card.appendChild(painter);

        // Muzeu
        if (item.museum && item.museumLabel) {
            const museum = document.createElement('p');
            const museumLink = document.createElement('a');
            const museumId = item.museum.value.split('/').pop();
            museumLink.href = `https://www.wikidata.org/wiki/${museumId}`;
            museumLink.target = '_blank';
            museumLink.rel = 'noopener noreferrer';
            museumLink.textContent = item.museumLabel.value;
            museum.appendChild(document.createTextNode('Museum: '));
            museum.appendChild(museumLink);
            card.appendChild(museum);
        }

        grid.appendChild(card);
    });

    resultsContainer.appendChild(grid);

    loadingIndicator.style.display = 'none';
    document.getElementById("exportCsv").style.display = 'inline-block';
    document.getElementById("exportHtml").style.display = 'inline-block';
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

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.classList.add('fade-out');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('fade-out');
    }, 600); // Match the duration of the fade-out animation
}
export { getWorksOfArtGogh, getWorksOfArtDaVinci, fetchSimilarArtists, fetchArtistsInfluencedByVanGogh, displayTopPaintingsInfluencedByGogh };