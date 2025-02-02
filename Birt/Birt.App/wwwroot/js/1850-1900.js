async function fetchLabel(wikidataId) {
    const query = `
        SELECT ?label WHERE {
            wd:${wikidataId} rdfs:label ?label.
            FILTER(LANG(?label) = "en").
        }
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {'Accept': 'application/sparql-results+json'}
    });
    const data = await response.json();
    return data.results.bindings[0]?.label?.value || wikidataId;
}
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, backoff));
                return fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (error.message.includes('Cookie “GeoIP” has been rejected')) {
            console.warn('Suppressed cookie error:', error.message);
            return new Response(); // Return an empty response to suppress the error
        }
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PaintingInfluencesDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('paintings')) {
                db.createObjectStore('paintings', { keyPath: 'artistId' });
            }
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function getCachedData(db, artistId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['paintings'], 'readonly');
        const store = transaction.objectStore('paintings');
        const request = store.get(artistId);
        request.onsuccess = (event) => {
            console.log("Got already cached data from the database: ", event.target.result);
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            console.error('Failed to retrieve data:', event.target.error);
            reject(event.target.error);
        };
    });
}

async function setCachedData(db, artistId, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['paintings'], 'readwrite');
        const store = transaction.objectStore('paintings');
        const request = store.put({ artistId, data, timestamp: new Date().getTime() });
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
async function getInfluencesBetween1850and1900() {
    const endpointUrl = "https://query.wikidata.org/sparql";
    const sparqlQuery = `
    #title: Painting born 1850-1900 and their influences
    #defaultView:Table
    SELECT DISTINCT ?artist ?artistLabel ?birthDate ?influenceLabel ?influenceTypeLabel WHERE {
      ?artist wdt:P106 wd:Q1028181;  # occupation: artist
             wdt:P569 ?birthDate;    # date of birth
             wdt:P737|wdt:P941 ?influence.  # influenced by (P737) OR inspired by (P941)
      
      # Get the type of the influence (person, movement, event, etc)
      ?influence wdt:P31 ?influenceType.
      
      # Filter for artists born between 1850 and 1900
      FILTER(YEAR(?birthDate) >= 1850 && YEAR(?birthDate) <= 1900)
      
      # Get labels in English
      SERVICE wikibase:label { 
        bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
        ?artist rdfs:label ?artistLabel.
        ?influence rdfs:label ?influenceLabel.
        ?influenceType rdfs:label ?influenceTypeLabel.
      }
    }
    ORDER BY ?artistLabel ?birthDate
    LIMIT 1000
    `;

    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}&format=json`;

    try {
        const db = await openDatabase();
        const cachedData = await getCachedData(db, 'influences1850-1900');
        if (cachedData && (new Date().getTime() - cachedData.timestamp) < 24 * 60 * 60 * 1000) { // 24 hours cache
            return cachedData.data;
        }

        const response = await fetch(url, {
            headers: { "Accept": "application/sparql-results+json" }
        });
        const data = await response.json();
        await setCachedData(db, 'influences1850-1900', data.results.bindings);
        return data.results.bindings;
    } catch (error) {
        console.error("Error fetching artists and influences:", error);
        return [];
    }
}
function displayInfluencesBetween1850and1900(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "<h2>Painters born 1850-1900 and their influences</h2>";

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    const headers = ['Artist', 'Birth Date', 'Influence', 'Influence Type'];
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

    data.forEach(item => {
        const row = document.createElement('tr');

        const artistCell = document.createElement('td');
        artistCell.style.border = '1px solid #ddd';
        artistCell.style.padding = '8px';
        artistCell.textContent = item.artistLabel.value;
        row.appendChild(artistCell);

        const birthDateCell = document.createElement('td');
        birthDateCell.style.border = '1px solid #ddd';
        birthDateCell.style.padding = '8px';
        birthDateCell.textContent = item.birthDate.value.split('T')[0];
        row.appendChild(birthDateCell);

        const influenceCell = document.createElement('td');
        influenceCell.style.border = '1px solid #ddd';
        influenceCell.style.padding = '8px';
        influenceCell.textContent = item.influenceLabel.value;
        row.appendChild(influenceCell);

        const influenceTypeCell = document.createElement('td');
        influenceTypeCell.style.border = '1px solid #ddd';
        influenceTypeCell.style.padding = '8px';
        influenceTypeCell.textContent = item.influenceTypeLabel.value;
        row.appendChild(influenceTypeCell);

        table.appendChild(row);
    });

    resultsContainer.appendChild(table);
}

async function showArtistsAndInfluences() {
    const data = await getInfluencesBetween1850and1900();
    displayInfluencesBetween1850and1900(data);
}

// Call the function to fetch and display the data
async function prepareData() {
    try {
        const response = await fetch('../ontology/Influence_description_ontology.ttl');
        if (!response.ok) {
            throw new Error(`Failed to fetch ontology data: ${response.statusText}`);
        }
        const text = await response.text();
        const lines = text.split('\n').slice(4); // Skip the first 4 lines containing prefixes
        const nodes = new Map();
        const links = [];

        console.log("Ontology data fetched successfully:", text);

        let currentNode = null;
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('ex:Q')) {
                const parts = line.split(' ');
                currentNode = parts[0].replace('ex:', '');
                const labelMatch = line.match(/rdfs:label\s+"([^"]+)"@en/);
                if (labelMatch) {
                    const label = labelMatch[1];
                    nodes.set(currentNode, { id: currentNode, label: label, group: 'artist' });
                    console.log(`Node added: ${currentNode} - ${label}`);
                } else {
                    console.log(`No label found for node: ${currentNode}`);
                }
            } else if (line.includes('ex:influenceDescription')) {
                const parts = line.split(' ');
                const influenceId = parts[2].replace('ex:', '').replace(';', '');
                links.push({ source: currentNode, target: influenceId });
                if (!nodes.has(influenceId)) {
                    nodes.set(influenceId, { id: influenceId, label: influenceId, group: 'event' });
                }
                console.log(`Link added: ${currentNode} -> ${influenceId}`);
            }
        });

        console.log("Nodes inside the function:", Array.from(nodes.values()));
        console.log("Links inside the function:", links);

        return { nodes: Array.from(nodes.values()), links };
    } catch (error) {
        console.error("Error in prepareData:", error);
        return { nodes: [], links: [] };
    }
}

export { showArtistsAndInfluences };