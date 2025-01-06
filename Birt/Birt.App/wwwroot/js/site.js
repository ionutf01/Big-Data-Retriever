﻿function getWorksOfArt() {
    const dropdown = document.getElementById("queryDropdown");
    const selectedArtist = dropdown.value;

    if (selectedArtist === "gogh") {
        getWorksOfArtGogh(); 
    } else if (selectedArtist === "vinci") {
        getWorksOfArtDaVinci(); 
    }else if (selectedArtist === "similar-gogh") {
        getSimilarArtistGogh(); 
    }
    else if (selectedArtist === "similar-vinci") {
        getSimilarArtistsForDaVinci(); 
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
        listItem.textContent = item.workLabel.value;
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

function displaySimilarArtists(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<h2>Similar Artists</h2>';
    const list = document.createElement('ul');
    data.results.bindings.forEach(item => {
        const listItem = document.createElement('li');
        const artistName = item.artistLabel.value;
        const artistId = item.artist.value.split('/').pop(); // Extrage ID-ul Wikidata
        listItem.innerHTML = `
            ${artistName} 
            <button class onclick="compareArtists('Q762', '${artistId}')">Compare</button>
        `;
        list.appendChild(listItem);
    });
    resultsContainer.appendChild(list);
}

async function getSimilarArtistGogh(){
    const query = `
        SELECT ?artist ?artistLabel WHERE {
            ?artist wdt:P135 wd:Q166713;       
            wdt:P106 wd:Q1028181.      
            FILTER(?artist != wd:Q5582).       
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
    displaySimilarArtists(data);
}

async function getSimilarArtistsForDaVinci() {
    const query = `
        SELECT ?artist ?artistLabel WHERE {
          wd:Q762 wdt:P135 ?movement.  
          ?artist wdt:P135 ?movement;      
                          wdt:P106 wd:Q1028181. 
          FILTER(?artist != wd:Q762).     
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
    displaySimilarArtists(data);
}


async function compareArtists(artist1Id, artist2Id) {
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
            # Adaugare etichete pentru proprietăți și valori
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
    displayComparison(data, artist1Id, artist2Id);
}




function displayComparison(data, artist1Id, artist2Id) {
    const comparisonContainer = document.getElementById('comparison');
    comparisonContainer.innerHTML = '<h2>Comparison</h2>';
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Property</th>
            <th>Leonardo da Vinci</th>
            <th>Selected Artist</th>
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

