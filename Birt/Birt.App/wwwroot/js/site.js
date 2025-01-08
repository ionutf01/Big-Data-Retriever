function getWorksOfArt() {
    const dropdown = document.getElementById("queryDropdown");
    const selectedArtist = dropdown.value;

    if (selectedArtist === "gogh") {
        getWorksOfArtGogh();
    } else if (selectedArtist === "vinci") {
        getWorksOfArtDaVinci();
    } else if (selectedArtist === "influencedByGogh") {
        displayInfluencedByGogh();
    } else if (selectedArtist === "paintingInfluencesbetween1850and1900") {
        displayPaintingInfluencesBetween1850And1900();
    } else if (selectedArtist === "paintingsInfluencedByGogh") {
        displayPaintingsInfluencedByGogh();
    }
}

async function getWorksOfArtGogh() {
    const query = `
         SELECT ?work ?workLabel ?workImage WHERE {
      ?work wdt:P170 wd:Q5582.
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
        SELECT ?work ?workLabel ?workImage WHERE {
  ?work wdt:P170 wd:Q762.  # Work of art by Leonardo da Vinci (Q762)
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