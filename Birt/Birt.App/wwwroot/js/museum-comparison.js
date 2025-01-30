export async function fetchComparisonResults(event) {
    event.preventDefault();

    const museum = document.getElementById("museum").value;
    const artist = document.getElementById("artist").value;

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
            headers: {
                "Accept": "application/sparql-results+json"
            }
        });

        if (!response.ok) {
            throw new Error("SPARQL query failed.");
        }

        const data = await response.json();
        const results = data.results.bindings;

        const resultsTable = document.getElementById("resultsTable");
        const resultsBody = document.getElementById("resultsBody");
        const noResults = document.getElementById("noResults");

        resultsBody.innerHTML = "";

        if (results.length > 0) {
            resultsTable.style.display = "table";
            noResults.style.display = "none";

            results.forEach(result => {
                const row = document.createElement("tr");

                const imageCell = document.createElement("td");
                if (result.image) {
                    const img = document.createElement("img");
                    img.src = result.image.value;
                    img.alt = result.title.value;
                    img.style.maxWidth = "100px";
                    imageCell.appendChild(img);
                    row.appendChild(imageCell); 
                }

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