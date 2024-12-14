function getWorksOfArt() {
    const dropdown = document.getElementById("queryDropdown");
    const selectedArtist = dropdown.value;

    if (selectedArtist === "gogh") {
        getWorksOfArtGogh(); 
    } else if (selectedArtist === "vinci") {
        getWorksOfArtDaVinci(); 
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
          ?work wdt:P170 wd:Q762.  # Work of art by Vincent van Gogh (Q5582)
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
