
async function loadOntology() {
    const store = $rdf.graph();
    const fetcher = new $rdf.Fetcher(store);
    const ontologyUrl =window.location.origin + '/lib/properties_ontology.ttl'; // Update with the correct path to your ontology file

    await fetcher.load(ontologyUrl);
    return store;
}

async function getPropertyLabel(propertyUri) {
    const store = await loadOntology();
    const property = $rdf.sym(propertyUri);
    const label = store.any(property, $rdf.sym('http://www.w3.org/2000/01/rdf-schema#label'), undefined, undefined);

    return label ? label.value : propertyUri;
}

// Example usage
getPropertyLabel('http://example.org/P937').then(label => {
    console.log(label); // Output: "Work location"
});
function getWorksOfArt() {
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
    displayComparison(data, artist1Id, artist2Id);
}
async function displayComparison(data, artist1Id, artist2Id) {
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

    for (const item of data.results.bindings) {
        const propertyUri = item.property.value;
        const propertyLabel = await getPropertyLabel(propertyUri);
        const artist1Value = item.artist1ValueLabel ? item.artist1ValueLabel.value :
            (item.artist1Value ? item.artist1Value.value : "N/A");
        const artist2Value = item.artist2ValueLabel ? item.artist2ValueLabel.value :
            (item.artist2Value ? item.artist2Value.value : "N/A");

        if (!groupedData[propertyLabel]) {
            groupedData[propertyLabel] = { artist1: new Set(), artist2: new Set() };
        }
        if (artist1Value !== "N/A") groupedData[propertyLabel].artist1.add(artist1Value);
        if (artist2Value !== "N/A") groupedData[propertyLabel].artist2.add(artist2Value);
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

    


