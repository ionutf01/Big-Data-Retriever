async function loadOntology() {
    const store = $rdf.graph();
    const fetcher = new $rdf.Fetcher(store);
    const ontologyUrl = 'path/to/ontology.ttl'; // Update with the correct path to your ontology file

    await fetcher.load(ontologyUrl);
    return store;
}

async function getPropertyLabel(propertyUri) {
    const store = await loadOntology();
    const property = $rdf.sym(propertyUri);
    const label = store.any(property, $rdf.sym('http://www.w3.org/2000/01/rdf-schema#label'), undefined, undefined);

    return label ? label.value : propertyUri;
}

// Example usage
getPropertyLabel('http://example.org/P937').then(label => {
    console.log(label); // Output: "Work location"
});
export { getPropertyLabel };