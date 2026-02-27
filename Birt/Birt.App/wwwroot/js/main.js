import { getWorksOfArtGogh, getWorksOfArtDaVinci, fetchSimilarArtists, fetchArtistsInfluencedByVanGogh, displayTopPaintingsInfluencedByGogh, displayComparison } from './site.js';
import { showArtistsAndInfluences, openReportModal } from './1850-1900.js';
import { exportTableToCSV, exportTableToHTML } from './export-utils.js';

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

export { getWorksOfArt, toggleCriteriaForm, handleQuery, exportTableToHTML, exportTableToCSV, openReportModal};