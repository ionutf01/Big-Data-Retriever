import { getWorksOfArtGogh, getWorksOfArtDaVinci, fetchSimilarArtists, fetchArtistsInfluencedByVanGogh, displayTopPaintingsInfluencedByGogh, displayComparison } from './site.js';
import { showArtistsAndInfluences, openReportModal } from './1850-1900.js';
function getWorksOfArt() {    
    console.log("Fetching data...");
    const dropdown = document.getElementById("queryDropdown");
    const selectedArtist = dropdown.value;
    if (selectedArtist === "gogh") {
        getWorksOfArtGogh(); // done
    } else if (selectedArtist === "vinci") {
        getWorksOfArtDaVinci(); // done
    } else if (selectedArtist === "similar-gogh") {
        fetchSimilarArtists('Q5582'); // done
    } else if (selectedArtist === "similar-vinci") {
        fetchSimilarArtists('Q762'); // done
    } else if (selectedArtist === "influencedByGogh") {
        fetchArtistsInfluencedByVanGogh(); // done
    } else if (selectedArtist === "paintingInfluencesbetween1850and1900") {
        showArtistsAndInfluences();
    } else if (selectedArtist === "paintingsInfluencedByGogh") {
        displayTopPaintingsInfluencedByGogh();
    }
}

function toggleCriteriaForm() {
    console.log('toggleCriteriaForm');
    const queryValue = document.getElementById('queryDropdown').value;
    const criteriaForm = document.getElementById('criteria-form');
    if (queryValue === 'similar-gogh' || queryValue === 'similar-vinci') {
        criteriaForm.style.display = 'block';
    } else {
        criteriaForm.style.display = 'none';
    }
}
function handleQuery() {
    console.log('handleQuery');
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

function exportTableToCSV(filename) {
    const csv = [];
    const rows = document.querySelectorAll("#results table tr");

    for (const row of rows) {
        const cols = row.querySelectorAll("td, th");
        const rowData = [];
        for (const col of cols) {
            rowData.push(col.innerText);
        }
        csv.push(rowData.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function exportTableToHTML(filename) {
    const table = document.querySelector("#results table").outerHTML;
    const htmlFile = new Blob([table], { type: "text/html" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(htmlFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export { getWorksOfArt, toggleCriteriaForm, handleQuery, exportTableToHTML, exportTableToCSV, openReportModal};