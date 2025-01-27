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
        headers: {'Accept': 'application/sparql-results+json'}
    });
    const data = await response.json();
    return data.results.bindings[0]?.label?.value || wikidataId;
}
async function displayPaintingInfluences(data, title = 'Top Painting Influences Between 1850 and 1900') {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator

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
        const influenceDescription = influenceDescriptionId !== 'N/A' ? `<a href="https://www.wikidata.org/wiki/${influenceDescriptionId}" target="_blank" rel="noopener noreferrer">${await fetchLabel(influenceDescriptionId)}</a>` : 'N/A';

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
            influenceCell.innerHTML = influenceDescription;
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

    loadingIndicator.style.display = 'none'; // Hide loading indicator
    resultsContainer.appendChild(table);
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
            console.log("Cached data from database: ", event.target.result);
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
async function displayPaintingInfluencesBetween1850And1900() {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator

    const cacheExpiryTime = 24 * 60 * 60 * 1000; // 24 hours
    const db = await openDatabase();

    const query = `
        PREFIX icon: <http://www.iconontology.org/ontology#>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>

        SELECT DISTINCT ?artist ?artistLabel ?influenceDescription WHERE {
            ?artist wdt:P106 wd:Q1028181.
            ?artist wdt:P569 ?birthDate.
            FILTER(?birthDate >= "1850-01-01"^^xsd:dateTime)
            FILTER(?birthDate <= "1900-12-31"^^xsd:dateTime)
            ?influenced wdt:P737 ?artist.
            OPTIONAL { ?influenced wdt:P1344 ?influenceDescription. }
            OPTIONAL { ?artist icon:hasInfluence ?influenceDescription. }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        ORDER BY ?artistLabel
        LIMIT 250
    `;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);

    try {
        const response = await fetchWithRetry(url, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        });
        const data = await response.json();
        console.log('SPARQL endpoint data:', data);

        const allPaintingsData = { results: { bindings: [] } };

        const fetchPaintingsPromises = data.results.bindings.map(async (item) => {
            const artistId = item.artist.value.split('/').pop();
            const cachedData = await getCachedData(db, artistId);
            console.log(`Cached data for artist ${artistId}:`, cachedData);

            if (cachedData && new Date().getTime() - cachedData.timestamp < cacheExpiryTime) {
                console.log(`Taking data for artist ${artistId} from cache`);
                cachedData.data.results.bindings.forEach(painting => {
                    painting.artistLabel = item.artistLabel;
                    painting.artist = item.artist;
                    painting.influenceDescription = item.influenceDescription;
                });
                allPaintingsData.results.bindings.push(...cachedData.data.results.bindings);
                return;
            }

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
            const paintingsResponse = await fetchWithRetry(paintingsUrl, {
                headers: {
                    'Accept': 'application/sparql-results+json'
                }
            });
            const paintingsData = await paintingsResponse.json();
            console.log(`Paintings data for artist ${artistId}:`, paintingsData);

            paintingsData.results.bindings.forEach(painting => {
                painting.artistLabel = item.artistLabel;
                painting.artist = item.artist;
                painting.influenceDescription = item.influenceDescription;
            });

            await setCachedData(db, artistId, paintingsData);

            allPaintingsData.results.bindings.push(...paintingsData.results.bindings);
        });

        await Promise.all(fetchPaintingsPromises);

        // Display the data after all promises are resolved
        console.log('All paintings data:', allPaintingsData);
        displayPaintingInfluences(allPaintingsData, 'Paintings Influences Between 1850 and 1900');
    } catch (error) {
        console.error('Failed to fetch data:', error);
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}



export { displayPaintingInfluencesBetween1850And1900 };
