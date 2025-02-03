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
export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
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
async function validateSparqlResults(sparqlResults) {
    const resultsArray = sparqlResults.data;
    if (!Array.isArray(resultsArray)) {
        console.error('sparqlResults.data is not an array:', resultsArray);
        return {
            conforms: false,
            results: [],
            error: 'Invalid SPARQL results format'
        };
    }

    // Transform SPARQL results to the expected format
    const transformedResults = resultsArray.map(result => {
        return {
            artist: result.artist?.value || '',
            artistLabel: result.artistLabel?.value || '',
            birthDate: result.birthDate?.value.split('T')[0] || '',
            influence: result.influence?.value || '',
            influenceLabel: result.influenceLabel?.value || '',
            influenceTypeLabel: result.influenceType?.value || ''
        };
    });

    const requestBody = JSON.stringify({ queryResults: transformedResults });
    try {
        const response = await fetch('http://localhost:5242/rdf/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Validation request failed:', error);
        return {
            conforms: false,
            results: [],
            error: `Failed to validate RDF data: ${error.message}`
        };
    }
}

async function getInfluencesBetween1850and1900() {
    const endpointUrl = "https://query.wikidata.org/sparql";
    const selectedLanguage = document.getElementById("languageDropdown").value || "en";

    const sparqlQuery = `
    #title: Painting born 1850-1900 and their influences
    #defaultView:Table
    SELECT DISTINCT ?artist ?artistLabel ?birthDate ?influence ?influenceLabel ?influenceTypeLabel WHERE {
      ?artist wdt:P106 wd:Q1028181;  # occupation: artist
             wdt:P569 ?birthDate;    # date of birth
             wdt:P737|wdt:P941 ?influence.  # influenced by (P737) OR inspired by (P941)

      # Get the type of the influence (person, movement, event, etc)
      ?influence wdt:P31 ?influenceType.

      # Filter for artists born between 1850 and 1900
      FILTER(YEAR(?birthDate) >= 1850 && YEAR(?birthDate) <= 1900)

      # Get labels in the selected language
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${selectedLanguage},en".
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
        const cachedData = await getCachedData(db, `influences1850-1900-${selectedLanguage}`);
        if (cachedData && (new Date().getTime() - cachedData.timestamp) < 24 * 60 * 60 * 1000) { // 24 hours cache
            const validationResults = await validateSparqlResults({ data: cachedData.data });
            if (validationResults.conforms) {
                return cachedData.data;
            } else {
                console.warn("Cached data validation failed, fetching new data.");
            }
        }

        const response = await fetch(url, {
            headers: { "Accept": "application/sparql-results+json" }
        });
        const data = await response.json();
        await setCachedData(db, `influences1850-1900-${selectedLanguage}`, data.results.bindings);

        const results = data.results.bindings;
        const validationResults = await validateSparqlResults({ data: results });
        openReportModal(validationResults);
        return results;
    } catch (error) {
        console.error("Error fetching artists and influences:", error);
        return [];
    }
}
export function openReportModal(validationResults) {
    const modal = document.getElementById('validationReportModal');
    const reportContent = document.getElementById('reportContent');

    // Clear previous content
    reportContent.innerHTML = '';

    // Populate modal with validation results
    const metadata = validationResults.metadata;
    const suggestedActions = validationResults.suggestedActions;

    reportContent.innerHTML = `
        <p><strong>Request ID:</strong> ${metadata.requestId}</p>
        <p><strong>Timestamp:</strong> ${metadata.timestamp}</p>
        <p><strong>Processed Records:</strong> ${metadata.processedRecords}</p>
        <p><strong>Processing Time:</strong> ${metadata.processingTime}</p>
        <p><strong>Valid Records:</strong> ${validationResults.validRecords}</p>
        <p><strong>Total Records:</strong> ${validationResults.totalRecords}</p>
        <h3>Suggested Actions</h3>
        <ul>
            ${suggestedActions.map(action => `<li>${action}</li>`).join('')}
        </ul>
    `;

    // Show the modal
    modal.style.display = 'block';
}
document.querySelector('.close').addEventListener('click', closeReportModal);
// Event listener for closing the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('validationReportModal');
    if (event.target == modal) {
        closeReportModal();
    }
}
function closeReportModal() {
    const modal = document.getElementById('validationReportModal');
    modal.style.display = 'none';
}
async function displayInfluencesBetween1850and1900(data) {
    // Show loading spinner
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading indicator
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

    loadingIndicator.style.display = 'none';

    document.getElementById("exportCsv").style.display = 'inline-block';
    document.getElementById("exportHtml").style.display = 'inline-block';
    resultsContainer.appendChild(table);
}
async function showArtistsAndInfluences() {
    const data = await getInfluencesBetween1850and1900();
    displayInfluencesBetween1850and1900(data);
}
export { showArtistsAndInfluences };