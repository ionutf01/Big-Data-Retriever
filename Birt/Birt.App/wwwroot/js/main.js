import { getWorksOfArtGogh, getWorksOfArtDaVinci, fetchSimilarArtists, fetchArtistsInfluencedByVanGogh, displayTopPaintingsInfluencedByGogh, displayComparison } from './site.js';
import { displayPaintingInfluencesBetween1850And1900 } from './1850-1900.js';
function getWorksOfArt() {
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
        displayPaintingInfluencesBetween1850And1900();
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

async function fetchRDFData() {
    const response = await fetch('http://localhost:5242/rdf/visualize');
    if (!response.ok) {
        throw new Error(`Failed to fetch RDF data: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Fetched RDF Data:', data); // Log the fetched data
    return data;
}

async function visualizeRDFDataImproved() {
    const { nodes, links } = await fetchRDFData();

    console.log('Nodes:', nodes); // Log nodes
    console.log('Links:', links); // Log links

    const svg = d3.select("#visualization");
    svg.selectAll("*").remove(); // Clear existing visualization

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px");

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            svg.attr("transform", event.transform);
        });

    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", d => `link ${d.label}`)
        .style("stroke-width", 2);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => `node ${d.group}`)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle")
        .attr("r", 12)
        .style("fill", d => color(d.group))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.label} (${d.group})`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    node.append("text")
        .attr("x", 15)
        .attr("y", 3)
        .style("font-size", "12px")
        .text(d => `${d.label} (${d.group})`);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function closeVisualization() {
    const svg = document.getElementById("visualization");
    svg.style.display = "none";
    const closeButton = document.getElementById("closeVisualization");
    closeButton.style.display = "none";
}

export { getWorksOfArt, toggleCriteriaForm, handleQuery, visualizeRDFDataImproved,closeVisualization };