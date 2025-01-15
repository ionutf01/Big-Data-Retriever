async function fetchMessage(property) {
    const response = await fetch('http://localhost:5242/rdf/' + property);
    if (response.ok) {
        const message = await response.text();
        console.log(message); // Output the message to the console
        return message;
        // You can also update the DOM or perform other actions with the message
    } else {
        console.error('Failed to fetch message');
    }
}


function getWorksOfArt() {
    const dropdown = document.getElementById("queryDropdown");
    const selectedArtist = dropdown.value;

    if (selectedArtist === "gogh") {
        getWorksOfArtGogh();
    } else if (selectedArtist === "vinci") {
        getWorksOfArtDaVinci(); 
    }else if (selectedArtist === "similar-gogh") {
        fetchSimilarArtists('Q5582'); 
    }
    else if (selectedArtist === "similar-vinci") {
        fetchSimilarArtists('Q762'); 
    }else if (selectedArtist === "influencedByGogh") {
        displayInfluencedByGogh();
    } else if (selectedArtist === "paintingInfluencesbetween1850and1900") {
        displayPaintingInfluencesBetween1850And1900();
    } else if (selectedArtist === "paintingsInfluencedByGogh") {
        displayTopPaintingsInfluencedByGogh();
    }
    
}

async function getWorksOfArtGogh() {
    const query = `
        SELECT DISTINCT ?work ?workLabel ?workImage ?artist ?artistLabel WHERE {
          ?work wdt:P170 wd:Q5582.  
          OPTIONAL { ?work wdt:P18 ?workImage. }
          OPTIONAL { ?work wdt:P170 ?artist. }
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
    displayResults(data);
}
async function fetchLabel(wikidataId) {
    const response = await fetch('http://localhost:5242/rdf/' + wikidataId);
    if (response.ok) {
        const data = await response.json();
        const label = data[0]?.Object || wikidataId;
        return label.split('@')[0].replace('{"object":"', '').replace('"}', '').replace('[', '');
    } else {
        console.error('Failed to fetch label');
        return wikidataId;
    }
}

async function displayPaintingInfluences(data, title = 'Top Painting Influences Between 1850 and 1900') {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `<h2>${title}</h2>`; // Clear previous results and set title

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    const headers = ['Artist', 'Influence Description', 'Painting'];
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

    for (const item of data.results.bindings) {
        const artistId = item.artist ? item.artist.value.split('/').pop() : '';
        const artistLabel = item.artistLabel ? item.artistLabel.value : 'Unknown';
        const influenceDescriptionId = item.influenceDescription ? item.influenceDescription.value.split('/').pop() : 'N/A';
        const influenceDescription = influenceDescriptionId !== 'N/A' ? await fetchLabel(influenceDescriptionId) : 'N/A';

        if (influenceDescription !== 'N/A' && !addedArtists.has(artistId)) {
            addedArtists.add(artistId);

            const row = document.createElement('tr');

            const artistCell = document.createElement('td');
            artistCell.style.border = '1px solid #ddd';
            artistCell.style.padding = '8px';
            const artistLink = document.createElement('a');
            artistLink.href = `https://www.wikidata.org/wiki/${artistId}`;
            artistLink.target = '_blank';
            artistLink.rel = 'noopener noreferrer';
            artistLink.textContent = artistLabel;
            artistCell.appendChild(artistLink);
            row.appendChild(artistCell);

            const influenceCell = document.createElement('td');
            influenceCell.style.border = '1px solid #ddd';
            influenceCell.style.padding = '8px';
            influenceCell.textContent = influenceDescription;
            row.appendChild(influenceCell);

            const paintingCell = document.createElement('td');
            paintingCell.style.border = '1px solid #ddd';
            paintingCell.style.padding = '8px';
            if (item.workImage && item.workImage.value) {
                const paintingLink = document.createElement('a');
                paintingLink.href = `https://www.wikidata.org/wiki/${item.work.value.split('/').pop()}`;
                paintingLink.target = '_blank';
                paintingLink.rel = 'noopener noreferrer';
                const paintingImg = document.createElement('img');
                paintingImg.src = item.workImage.value;
                paintingImg.alt = item.workLabel.value;
                paintingImg.width = 100;
                paintingImg.height = 100;
                paintingLink.appendChild(paintingImg);
                paintingCell.appendChild(paintingLink);
            } else {
                continue; // Skip rows where the painting is not available
            }
            row.appendChild(paintingCell);

            table.appendChild(row);
        }
    }

    resultsContainer.appendChild(table);
} {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `<h2>${title}</h2>`; // Clear previous results and set title

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    const headers = ['Artist', 'Influence Description', 'Painting'];
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
        const artistId = item.artist ? item.artist.value.split('/').pop() : '';
        const artistLabel = item.artistLabel ? item.artistLabel.value : 'Unknown';
        const influenceDescription = item.influenceDescription ? item.influenceDescription.value : 'N/A';

        if (influenceDescription !== 'N/A' && !addedArtists.has(artistId)) {
            addedArtists.add(artistId);

            const row = document.createElement('tr');

            const artistCell = document.createElement('td');
            artistCell.style.border = '1px solid #ddd';
            artistCell.style.padding = '8px';
            const artistLink = document.createElement('a');
            artistLink.href = `https://www.wikidata.org/wiki/${artistId}`;
            artistLink.target = '_blank';
            artistLink.rel = 'noopener noreferrer';
            artistLink.textContent = artistLabel;
            artistCell.appendChild(artistLink);
            row.appendChild(artistCell);

            const influenceCell = document.createElement('td');
            influenceCell.style.border = '1px solid #ddd';
            influenceCell.style.padding = '8px';
            influenceCell.textContent = influenceDescription;
            row.appendChild(influenceCell);

            const paintingCell = document.createElement('td');
            paintingCell.style.border = '1px solid #ddd';
            paintingCell.style.padding = '8px';
            if (item.workImage && item.workImage.value) {
                const paintingLink = document.createElement('a');
                paintingLink.href = `https://www.wikidata.org/wiki/${item.work.value.split('/').pop()}`;
                paintingLink.target = '_blank';
                paintingLink.rel = 'noopener noreferrer';
                const paintingImg = document.createElement('img');
                paintingImg.src = item.workImage.value;
                paintingImg.alt = item.workLabel.value;
                paintingImg.width = 100;
                paintingImg.height = 100;
                paintingLink.appendChild(paintingImg);
                paintingCell.appendChild(paintingLink);
            } else {
                return; // Skip rows where the painting is not available
            }
            row.appendChild(paintingCell);

            table.appendChild(row);
        }
    });

    resultsContainer.appendChild(table);
}
function displayResults(data) {
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
        if (item.workLabel.value.includes("Q") || !item.workImage || !item.workImage.value) {
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

    resultsContainer.appendChild(table);
}
async function getWorksOfArtDaVinci() {
    const query = `
        SELECT DISTINCT ?work ?workLabel ?workImage ?artist ?artistLabel WHERE {
          ?work wdt:P170 wd:Q762.
          OPTIONAL { ?work wdt:P18 ?workImage. }
          OPTIONAL { ?work wdt:P170 ?artist. }
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
    displayResults(data);
}

function displaySimilarArtistsVinci(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<h2>Similar Artists</h2>';
    const list = document.createElement('ul');
    data.results.bindings.forEach(item => {
        const listItem = document.createElement('li');
        const artistName = item.artistLabel.value;
        const artistId = item.artist.value.split('/').pop(); 
        listItem.innerHTML = `
            ${artistName} 
            <button onclick="compareArtists('Q762', '${artistId}')">Compare</button>
        `;
        list.appendChild(listItem);
    });
    resultsContainer.appendChild(list);
}

function displaySimilarArtistsGogh(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<h2>Similar Artists</h2>';
    const list = document.createElement('ul');
    data.results.bindings.forEach(item => {
        const listItem = document.createElement('li');
        const artistName = item.artistLabel.value;
        const artistId = item.artist.value.split('/').pop(); 
        listItem.innerHTML = `
            ${artistName} 
            <button onclick="compareArtists('Q5582', '${artistId}')">Compare</button>
        `;
        list.appendChild(listItem);
    });
    resultsContainer.appendChild(list);
}
async function fetchSimilarArtists(artistId) {
    const movement = document.getElementById('movement').value;
    const occupation = document.getElementById('occupation').value;
    const country = document.getElementById('country').value;

    let filters = [];
    if (movement) filters.push(`?artist wdt:P135 wd:${movement}.`);
    if (occupation) filters.push(`?artist wdt:P106 wd:${occupation}.`);
    if (country) filters.push(`?artist wdt:P27 wd:${country}.`);

    filters.push(`FILTER(?artist != wd:${artistId}).`); 

    if (filters.length === 0) {
        alert("Please select at least one criterion.");
        return;
    }

    const query = `
        SELECT ?artist ?artistLabel WHERE {
            ${filters.join('\n')}
            SERVICE wikibase:label { 
                bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". 
            }
        }
        LIMIT 15
    `;

    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();

    if (artistId === 'Q762') {
        displaySimilarArtistsVinci(data);
    } else if (artistId === 'Q5582') {
        displaySimilarArtistsGogh(data);
    }
}

async function compareArtists(artist1Id, artist2Id) {
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

async function displayComparison(data, artist1Name, artist2Name) {
    const comparisonContainer = document.getElementById('comparison');
    comparisonContainer.innerHTML = `<h2>Comparison: ${artist1Name} vs. ${artist2Name}</h2>`;
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Property</th>
            <th>${artist1Name}</th>
            <th>${artist2Name}</th>
        </tr>
    `;

    const groupedData = {};

    for (const item of data.results.bindings) {
        const propertyUri = item.property.value;
        console.log("Property URI: " + propertyUri);
        const propertyItself = propertyUri.split('/').pop();
        console.log("Property Itself: " + propertyItself);
        const propertyLabel = await fetchMessage(propertyItself);
        const cleanProperty = propertyLabel.split('@')[0].replace('{"object":"', '').replace('"}', '').replace('[', '')
        console.log("Property Label: " + cleanProperty);


        const artist1Value = item.artist1ValueLabel ? item.artist1ValueLabel.value :
            (item.artist1Value ? item.artist1Value.value : "N/A");
        const artist2Value = item.artist2ValueLabel ? item.artist2ValueLabel.value :
            (item.artist2Value ? item.artist2Value.value : "N/A");

        if (!groupedData[cleanProperty]) {
            groupedData[cleanProperty] = {artist1: new Set(), artist2: new Set()};
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
        table.appendChild(row);
    }

    comparisonContainer.appendChild(table);
}


/*
* Influences
* */

async function displayInfluencedByGogh() {
    const query = `
            SELECT ?artist ?artistLabel WHERE {
  ?artist wdt:P737 wd:Q5582.  # Filter by influence: Van Gogh (Q5582)
  ?artist wdt:P106 wd:Q1028181.  # Filter by occupation: painter
  ?artist wdt:P31 wd:Q5.         # Filter by instance of: human
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
    displayResults(data);
}


async function displayPaintingInfluencesBetween1850And1900() {
    const query = `
       SELECT DISTINCT ?artist ?artistLabel ?influenceDescription WHERE {
  ?artist wdt:P106 wd:Q1028181.
  ?artist wdt:P569 ?birthDate.
  FILTER(?birthDate >= "1850-01-01"^^xsd:dateTime)
  FILTER(?birthDate <= "1900-12-31"^^xsd:dateTime)
  ?influenced wdt:P737 ?artist.
  OPTIONAL { ?influenced wdt:P1344 ?influenceDescription. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
ORDER BY ?artistLabel
LIMIT 1000
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });
    const data = await response.json();

    let allPaintingsData = { results: { bindings: [] } };

    for (const item of data.results.bindings) {
        const artistId = item.artist.value.split('/').pop();
        const paintingsQuery = `
            SELECT ?work ?workLabel ?workImage WHERE {
                ?work wdt:P170 wd:${artistId}.  # Created by the artist
                ?work wdt:P31 wd:Q3305213.  # Instance of painting (Q3305213)
                OPTIONAL { ?work wdt:P18 ?workImage. }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            LIMIT 2
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
            painting.artistLabel = item.artistLabel;
            painting.artist = item.artist;
            painting.influenceDescription = item.influenceDescription;
        });

        allPaintingsData.results.bindings.push(...paintingsData.results.bindings);
    }

    displayPaintingInfluences(allPaintingsData, 'Top 2 Paintings Influences Between 1850 and 1900');
}
async function displayTopPaintingsInfluencedByGogh() {
    const paintersQuery = `
        SELECT ?artist ?artistLabel WHERE {
            ?artist wdt:P737 wd:Q5582.  # Influenced by Vincent van Gogh (Q5582)
            ?artist wdt:P106 wd:Q1028181.  # Occupation: painter
            ?artist wdt:P31 wd:Q5.         # Instance of: human
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

        // Add artistLabel to each painting
        paintingsData.results.bindings.forEach(painting => {
            painting.artistLabel = painter.artistLabel;
            painting.artist = painter.artist;
        });

        allPaintingsData.results.bindings.push(...paintingsData.results.bindings);
    }

    displayResults(allPaintingsData);
}


function toggleCriteriaForm() {
    const queryValue = document.getElementById('queryDropdown').value;
    const criteriaForm = document.getElementById('criteria-form');
    if (queryValue === 'similar-gogh' || queryValue === 'similar-vinci') {
        criteriaForm.style.display = 'block';
    } else {
        criteriaForm.style.display = 'none';
    }
}
function handleQuery() {
    const queryValue = document.getElementById('queryDropdown').value;
    console.log(queryValue);
    if (!queryValue) {
        alert("Please select a query before searching.");
        return;
    }
    if (queryValue === 'similar-gogh') {
        fetchSimilarArtists('Q5582');
        return;
    }
    else if (queryValue === 'similar-vinci') {
        fetchSimilarArtists('Q762');
        return;
    }
}