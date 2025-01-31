import { openModal } from './site.js';
export async function fetchComparisonResults(event) {
    event.preventDefault();

    const museum = document.getElementById("museum").value;
    const artist = document.getElementById("artist").value;
    const resultsTable = document.getElementById("resultsTable");
    const resultsBody = document.getElementById("resultsBody");
    const noResults = document.getElementById("noResults");
    const hideTableBtn = document.getElementById("hideTableBtn");

    if (!museum || !artist) {
        alert("Please select both a museum and an artist.");
        return;
    }

    const sparqlQuery = `
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>
        SELECT ?painting ?title ?museumName ?image WHERE {
            ?painting wdt:P170 wd:${artist} .
            ?painting wdt:P276 ?museum .
            FILTER (?museum != wd:${museum}) .
            ?museum rdfs:label ?museumName .
            ?painting rdfs:label ?title .
            OPTIONAL { ?painting wdt:P18 ?image. }
            FILTER (lang(?title) = "en" && lang(?museumName) = "en")
        }
    `;

    const endpointUrl = "https://query.wikidata.org/sparql";
    const fullUrl = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;

    try {
        const response = await fetch(fullUrl, {
            headers: { "Accept": "application/sparql-results+json" }
        });

        if (!response.ok) {
            throw new Error("SPARQL query failed.");
        }

        const data = await response.json();
        const results = data.results.bindings;

        resultsBody.innerHTML = "";

        if (results.length > 0) {
            resultsTable.style.display = "table";
            noResults.style.display = "none";
            hideTableBtn.style.display = "inline-block"; // Show Hide Table button

            results.forEach(result => {
                const row = document.createElement("tr");

               const imageCell = document.createElement("td");
                if (result.image) {
                    const img = document.createElement("img");
                    img.src = result.image.value;
                    img.alt = result.title.value;
                    img.style.maxWidth = "100px";
                    img.style.cursor = 'pointer'; // Change cursor to pointer
                    img.addEventListener('click', () => {
                        openModal(img.src, img.alt); // Open the modal with the clicked image
                    });
                    imageCell.appendChild(img);
                }
                row.appendChild(imageCell);

                const titleCell = document.createElement("td");
                titleCell.textContent = result.title.value;
                row.appendChild(titleCell);

                const museumCell = document.createElement("td");
                museumCell.textContent = result.museumName.value;
                row.appendChild(museumCell);

                resultsBody.appendChild(row);
            });
        } else {
            resultsTable.style.display = "none";
            noResults.style.display = "block";
            hideTableBtn.style.display = "none"; 
        }
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        alert("An error occurred while fetching the results.");
    }
}

export function updateMessage() {
    const artistSelect = document.getElementById('artist');
    const museumSelect = document.getElementById('museum');
    const messageElement = document.getElementById('dynamicMessage');

    const artistText = artistSelect.options[artistSelect.selectedIndex]?.text || 'an artist';
    const museumText = museumSelect.options[museumSelect.selectedIndex]?.text || 'a museum';

    if (artistSelect.value && museumSelect.value) {
        messageElement.textContent = `You will see paintings from ${artistText} that are not in ${museumText}.`;
    } else if (artistSelect.value) {
        messageElement.textContent = `Select a museum to see paintings from ${artistText} that are not in it.`;
    } else if (museumSelect.value) {
        messageElement.textContent = `Select an artist to see paintings that are not in ${museumText}.`;
    } else {
        messageElement.textContent = `Select an artist and a museum to see paintings from the artist that are not in the museum.`;
    }
}

export async function fetchMuseumAndArtists(event) {
    event.preventDefault();

    const artist = document.getElementById("selectedArtist").value;

    if (!artist) {
        alert("Please select an artist.");
        return;
    }

    console.log("Fetching museums for artist:", artist);

    const museumsQuery = `
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>

        SELECT DISTINCT ?museum WHERE {
            ?painting wdt:P170 wd:${artist};
                      wdt:P276 ?museum.
        }
        LIMIT 7
    `;

    try {
        const museums = await runSPARQLQuery(museumsQuery);
        if (!museums.length) {
            console.warn("No museums found.");
            return;
        }

        console.log("Museums found:", museums);

        const museumIds = museums
            .map(m => `wd:${m.museum.replace("http://www.wikidata.org/entity/", "")}`)
            .join(" ");

        console.log("Formatted Museum IDs:", museumIds);

        const artistsQuery = `
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            
            SELECT DISTINCT ?museumLabel (SAMPLE(?otherArtist) AS ?otherArtist) (SAMPLE(?otherArtistLabel) AS ?otherArtistLabel) WHERE {
                VALUES ?museum { ${museumIds} }
                ?otherPainting wdt:P170 ?otherArtist;
                               wdt:P276 ?museum.
            
                FILTER (?otherArtist != wd:${artist})
            
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            GROUP BY ?museumLabel
            ORDER BY ?museumLabel

        `;

        const artists = await runSPARQLQuery(artistsQuery);
        if (!artists.length) {
            console.warn("No other artists found.");
            return;
        }

        const artistIdsArray = artists
            .map(a => a.otherArtist)
            .filter(id => id.startsWith("http://www.wikidata.org/entity/Q"))  
            .map(id => id.replace("http://www.wikidata.org/entity/", "wd:"));  

        console.log("Valid Artist IDs Array:", artistIdsArray);

        if (artistIdsArray.length === 0) {
            console.warn("No valid artists found after filtering.");
            return;
        }

        const artistIds = artistIdsArray.join(" ");
        console.log("Formatted Valid Artist IDs:", artistIds);

        const paintingsQuery = `
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            
            SELECT DISTINCT ?museumLabel ?otherArtistLabel (SAMPLE(?otherPaintingLabel) AS ?otherPaintingLabel) (SAMPLE(?paintingImage) AS ?paintingImage) WHERE {
                VALUES ?museum { ${museumIds} }
                VALUES ?otherArtist { ${artistIds} }
                
                ?otherPainting wdt:P170 ?otherArtist;
                               wdt:P276 ?museum.
            
                OPTIONAL { ?otherPainting rdfs:label ?otherPaintingLabel. FILTER(LANG(?otherPaintingLabel) = "en") }
                OPTIONAL { ?otherPainting wdt:P18 ?paintingImage }
            
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            GROUP BY ?museumLabel ?otherArtistLabel
            ORDER BY ?museumLabel
        `;

        let paintings = await runSPARQLQuery(paintingsQuery);

        paintings = await fetchAlternativePaintingImages(paintings, museumIds, artistIds);

        if (!paintings.length) {
            console.warn("No paintings found.");
            return;
        }

        console.log("Paintings found:", paintings);

        populateTable(paintings);

    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        alert("An error occurred while fetching the results. Check console for details.");
    }
}

async function fetchAlternativePaintingImages(paintings, museumIds, artistIds) {
    let paintingsWithImages = paintings.filter(p => p.paintingImage);

    if (paintingsWithImages.length < paintings.length) {
        console.log("Fetching alternative paintings with images...");

        const alternativePaintingsQuery = `
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>

            SELECT DISTINCT ?museumLabel ?otherArtistLabel ?otherPaintingLabel ?paintingImage WHERE {
                VALUES ?museum { ${museumIds} }
                VALUES ?otherArtist { ${artistIds} }
                
                ?otherPainting wdt:P170 ?otherArtist;
                               wdt:P276 ?museum.

                OPTIONAL { ?otherPainting rdfs:label ?otherPaintingLabel. FILTER(LANG(?otherPaintingLabel) = "en") }
                OPTIONAL { ?otherPainting wdt:P18 ?paintingImage }

                FILTER EXISTS { ?otherPainting wdt:P18 ?paintingImage }  # ✅ Ensure we only get paintings with images

                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            ORDER BY ?museumLabel
            LIMIT 5
        `;

        const alternativePaintings = await runSPARQLQuery(alternativePaintingsQuery);
        return paintingsWithImages.concat(alternativePaintings);
    }

    return paintingsWithImages;
}

async function runSPARQLQuery(query) {
    const endpointUrl = "https://query.wikidata.org/sparql";
    const fullUrl = `${endpointUrl}?query=${encodeURIComponent(query)}`;

    console.log("Executing SPARQL Query:", query);

    const response = await fetch(fullUrl, {
        headers: {
            "Accept": "application/sparql-results+json"
        }
    });

    if (!response.ok) {
        throw new Error(`SPARQL query failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("SPARQL Response Data:", data);

    return data.results.bindings.map(result => {
        const obj = {};
        for (const key in result) {
            obj[key] = result[key].value;
        }
        return obj;
    });
}

function populateTable(results) {
    const resultsTable = document.getElementById("museumResultsTable");
    const resultsBody = document.getElementById("museumResultsBody");
    const noResults = document.getElementById("noMuseumResults");

    resultsBody.innerHTML = "";

    if (results.length > 0) {
        resultsTable.style.display = "table";
        noResults.style.display = "none";
        document.getElementById("hideMuseumResultsBtn").style.display = "inline-block";
        results.forEach(result => {
            const row = document.createElement("tr");

            const museumCell = document.createElement("td");
            museumCell.textContent = result.museumLabel || "Unknown Museum";
            row.appendChild(museumCell);

            const artistCell = document.createElement("td");
            artistCell.textContent = result.otherArtistLabel || "Unknown Artist";
            row.appendChild(artistCell);

            const paintingCell = document.createElement("td");
            paintingCell.textContent = result.otherPaintingLabel || "Unknown Painting";
            row.appendChild(paintingCell);

            const imageCell = document.createElement("td");
            if (result.paintingImage) {
                const img = document.createElement("img");
                img.src = result.paintingImage;
                img.alt = result.otherPaintingLabel;
                img.style.maxWidth = "100px";
                img.style.height = "auto";
                img.style.cursor = 'pointer'; // Change cursor to pointer
                img.addEventListener('click', () => {
                    openModal(img.src, img.alt); // Open the modal with the clicked image
                });
                imageCell.appendChild(img);
            }
            row.appendChild(imageCell);

            resultsBody.appendChild(row);
        });

        console.log("Results populated successfully.");
    } else {
        resultsTable.style.display = "none";
        noResults.style.display = "block";
    }
}

export async function fetchSimilarPaintings(event) {
    event.preventDefault();

    const artistId = document.getElementById("similarArtist").value;
    const museumId = document.getElementById("similarMuseum").value;

    if (!artistId || !museumId) {
        alert("Please select both an artist and a museum.");
        return;
    }

    const sparqlQuery = `
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>

        SELECT DISTINCT ?painting ?paintingLabel ?image ?artist ?artistLabel ?museum ?museumLabel WHERE {
            ?originalPainting wdt:P170 wd:${artistId} .  
            ?originalPainting wdt:P135 ?movement .       

            ?painting wdt:P135 ?movement .               
            ?painting wdt:P31 wd:Q3305213 .              
            ?painting wdt:P170 ?artist .                 
            ?painting wdt:P276 ?museum .                 
            ?museum wdt:P31 wd:Q33506 .                  

            ?painting wdt:P18 ?image.                    

            FILTER (?museum != wd:${museumId})           
            FILTER (?artist != wd:${artistId})           

            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 50
    `;

    const endpointUrl = "https://query.wikidata.org/sparql";
    const fullUrl = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;

    try {
        const response = await fetch(fullUrl, {
            headers: { "Accept": "application/sparql-results+json" }
        });

        if (!response.ok) {
            throw new Error("SPARQL query failed.");
        }

        const data = await response.json();
        const results = data.results.bindings;
        const resultsTable = document.getElementById("similarPaintingsTable");
        const resultsBody = document.getElementById("similarPaintingsBody");
        const noResults = document.getElementById("noSimilarResults");

        resultsBody.innerHTML = "";

        if (results.length > 0) {
            resultsTable.style.display = "table";
            noResults.style.display = "none";
            console.log("done")
            document.getElementById("hideSimilarPaintingsBtn").style.display = "inline-block";
            results.forEach(result => {
                const row = document.createElement("tr");

                const paintingCell = document.createElement("td");
                paintingCell.textContent = result.paintingLabel.value;
                row.appendChild(paintingCell);

                const artistCell = document.createElement("td");
                artistCell.textContent = result.artistLabel.value;
                row.appendChild(artistCell);

                const museumCell = document.createElement("td");
                museumCell.textContent = result.museumLabel.value;
                row.appendChild(museumCell);

                const imageCell = document.createElement("td");
                if (result.image) {
                    const img = document.createElement("img");
                    img.src = result.image.value;
                    img.alt = result.paintingLabel.value;
                    img.style.maxWidth = "100px";
                    img.style.cursor = "pointer";
                    img.addEventListener("click", () => {
                        openModal(img.src, img.alt);
                    });
                    imageCell.appendChild(img);
                }
                row.appendChild(imageCell);

                resultsBody.appendChild(row);
            });
        } else {
            resultsTable.style.display = "none";
            noResults.style.display = "block";
        }
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        alert("An error occurred while fetching the results.");
    }
}

