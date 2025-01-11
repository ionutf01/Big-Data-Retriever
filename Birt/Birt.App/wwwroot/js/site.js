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
        displayPaintingsInfluencedByGogh();
    }
    
}

async function getWorksOfArtGogh() {
    const query = `
        SELECT ?work ?workLabel WHERE {
          ?work wdt:P170 wd:Q5582.  
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 10
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

function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    data.results.bindings.forEach(item => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.workLabel ? item.workLabel.value : item.artistLabel.value)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        if (item.workImage && item.workImage.value) {
            const img = document.createElement('img');
            img.src = item.workImage.value;
            img.alt = item.workLabel ? item.workLabel.value : 'Image';
            img.width = 100;
            img.height = 100;
            img.loading = 'lazy';
            link.appendChild(img);
            const text = document.createElement('span');
            text.textContent = item.workLabel ? ` ${item.workLabel.value}` : ' Image';
            link.appendChild(text);
        } else {
            link.textContent = item.workLabel ? item.workLabel.value : item.artistLabel.value;
        }

        listItem.appendChild(link);
        resultsContainer.appendChild(listItem);
    });
}

async function getWorksOfArtDaVinci() {
    const query = `
        SELECT ?work ?workLabel WHERE {
          ?work wdt:P170 wd:Q762. 
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 10
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
            FILTER(?property IN (wdt:P135, wdt:P106, wdt:P569, wdt:P570)) # Mișcare, profesie, naștere, deces
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

function displayComparison(data, artist1Name, artist2Name) {
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

    data.results.bindings.forEach(item => {
        const property = item.propertyLabel ? item.propertyLabel.value : "N/A";
        const artist1Value = item.artist1ValueLabel ? item.artist1ValueLabel.value :
            (item.artist1Value ? item.artist1Value.value : "N/A");
        const artist2Value = item.artist2ValueLabel ? item.artist2ValueLabel.value :
            (item.artist2Value ? item.artist2Value.value : "N/A");

        if (!groupedData[property]) {
            groupedData[property] = { artist1: new Set(), artist2: new Set() };
        }
        if (artist1Value !== "N/A") groupedData[property].artist1.add(artist1Value);
        if (artist2Value !== "N/A") groupedData[property].artist2.add(artist2Value);
    });

    for (const [property, values] of Object.entries(groupedData)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${property}</td>
            <td>${Array.from(values.artist1).join(", ")}</td>
            <td>${Array.from(values.artist2).join(", ")}</td>
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
       SELECT ?artist ?artistLabel ?influenceDescription WHERE {
  ?artist wdt:P106 wd:Q1028181.  
  ?artist wdt:P569 ?birthDate.   
  FILTER(?birthDate >= "1850-01-01"^^xsd:dateTime)
  FILTER(?birthDate <= "1900-12-31"^^xsd:dateTime)
  ?influenced wdt:P737 ?artist. 
  OPTIONAL { ?influenced wdt:P1344 ?influenceDescription. }  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
ORDER BY ?artistLabel
LIMIT 200
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

async function displayPaintingsInfluencedByGogh() {
    const query = `
        SELECT ?work ?workLabel ?workImage WHERE {
  ?work wdt:P737 wd:Q5582.  # Work of art influenced by Vincent van Gogh (Q5582)
  OPTIONAL { ?work wdt:P18 ?workImage. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
LIMIT 10
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