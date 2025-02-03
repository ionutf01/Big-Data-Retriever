using VDS.RDF;
using VDS.RDF.Parsing;
using VDS.RDF.Shacl;
using WebApplication1;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers.Remove("X-Frame-Options");  
    context.Response.Headers.Add("Content-Security-Policy", "frame-ancestors 'self' http://localhost:5077;");
    await next();
});


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.MapGet("/rdf/{property}", (string property) =>
{
    var graph = new Graph();
    try
    {
        FileLoader.Load(graph, "./properties_ontology.ttl");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error loading file: {ex.Message}");
    }
  
    var ttlParser = new TurtleParser();
    ttlParser.Load(graph, "./properties_ontology.ttl");
    var uri = new Uri($"https://www.wikidata.org/wiki/Property:{property}");
    var triples = graph.GetTriplesWithSubject(graph.CreateUriNode(uri)).ToList();

    if (!triples.Any())
    {
        uri = new Uri($"https://www.wikidata.org/wiki/Class:{property}");
        triples = graph.GetTriplesWithSubject(graph.CreateUriNode(uri)).ToList();
    }

    var result = triples.Select(triple => new
    {
        Object = triple.Object.ToString()
    });
    var filteredResult = result.Where(r => r.Object.Contains("@en"));
    return Results.Ok(filteredResult);
})
.WithName("GetRdfProperty")
.WithOpenApi();

app.MapPost("/rdf/validate", async (SparqlValidationRequest request) =>
{
    var startTime = DateTime.UtcNow;
    var requestId = Guid.NewGuid().ToString();
    var currentTimestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

    try
    {
        if (request.QueryResults == null || !request.QueryResults.Any())
        {
            return Results.BadRequest(new ValidationResponse
            {
                Success = false,
                Error = "No query results provided for validation",
                Metadata = new MetaData
                {
                    RequestId = requestId,
                    Timestamp = currentTimestamp,
                    ProcessedRecords = 0,
                    ProcessingTime = DateTime.UtcNow - startTime
                }
            });
        }

        var validationIssues = new List<ValidationIssue>();
        var validResults = new List<SparqlQueryResult>();

        // Validate each result
        foreach (var result in request.QueryResults)
        {
            var resultIsValid = true;

            // Validate Artist URI
            if (!Uri.IsWellFormedUriString(result.Artist, UriKind.Absolute))
            {
                resultIsValid = false;
                validationIssues.Add(new ValidationIssue
                {
                    Message = $"Invalid Artist URI: {result.Artist}",
                    Path = "Artist",
                    FocusNode = result.Artist,
                    Severity = ViolationSeverity.Critical,
                    SuggestedAction = "Exclude this record and report to data source administrator. URI format must be fixed at source."
                });
            }

            // Validate Artist Label
            if (string.IsNullOrEmpty(result.ArtistLabel))
            {
                resultIsValid = false;
                validationIssues.Add(new ValidationIssue
                {
                    Message = "Artist must have a label",
                    Path = "ArtistLabel",
                    FocusNode = result.Artist,
                    Severity = ViolationSeverity.Warning,
                    SuggestedAction = "Try to fetch label from Wikidata using the artist URI, or mark for manual review."
                });
            }

            // Validate Birth Date
            if (DateTime.TryParse(result.BirthDate, out DateTime birthDate))
            {
                if (birthDate.Year < 1850 || birthDate.Year > 1900)
                {
                    resultIsValid = false;
                    validationIssues.Add(new ValidationIssue
                    {
                        Message = $"Birth date {result.BirthDate} is outside the valid range (1850-1900)",
                        Path = "BirthDate",
                        FocusNode = result.Artist,
                        Severity = ViolationSeverity.Critical,
                        SuggestedAction = "Exclude this record as it doesn't meet the time period criteria. Consider adjusting your SPARQL query filters."
                    });
                }
            }
            else
            {
                resultIsValid = false;
                validationIssues.Add(new ValidationIssue
                {
                    Message = $"Invalid birth date format: {result.BirthDate}",
                    Path = "BirthDate",
                    FocusNode = result.Artist,
                    Severity = ViolationSeverity.Critical,
                    SuggestedAction = "Exclude this record. Date format must be YYYY-MM-DD."
                });
            }

            // Validate Influence URI and Type
            if (!Uri.IsWellFormedUriString(result.Influence, UriKind.Absolute))
            {
                resultIsValid = false;
                validationIssues.Add(new ValidationIssue
                {
                    Message = $"Invalid Influence URI: {result.Influence}",
                    Path = "Influence",
                    FocusNode = result.Influence,
                    Severity = ViolationSeverity.Critical,
                    SuggestedAction = "Exclude this influence relationship. URI format must be fixed at source."
                });
            }

            if (string.IsNullOrEmpty(result.InfluenceLabel))
            {
                validationIssues.Add(new ValidationIssue
                {
                    Message = "Influence missing label",
                    Path = "InfluenceLabel",
                    FocusNode = result.Influence,
                    Severity = ViolationSeverity.Warning,
                    SuggestedAction = "Try to fetch label from Wikidata using the influence URI, or mark for manual review."
                });
            }

            // If the result is valid, add it to valid results
            if (resultIsValid)
            {
                validResults.Add(result);
            }
        }

        var processingTime = DateTime.UtcNow - startTime;

        var validationResponse = new ValidationResponse
        {
            Success = !validationIssues.Any(i => i.Severity == ViolationSeverity.Critical),
            Results = validationIssues,
            Metadata = new MetaData
            {
                RequestId = requestId,
                Timestamp = currentTimestamp,
                ProcessedRecords = request.QueryResults.Count,
                ProcessingTime = processingTime
            },
            ValidRecords = validResults.Count,
            TotalRecords = request.QueryResults.Count,
            SuggestedActions = new List<string>
            {
                $"Critical Issues: {validationIssues.Count(i => i.Severity == ViolationSeverity.Critical)}",
                $"Warnings: {validationIssues.Count(i => i.Severity == ViolationSeverity.Warning)}",
                $"Info Items: {validationIssues.Count(i => i.Severity == ViolationSeverity.Info)}",
                validationIssues.Any(i => i.Severity == ViolationSeverity.Critical) 
                    ? "Some records have critical violations and should be excluded. Consider reviewing your SPARQL query or data source."
                    : "Data has only minor issues and can be used with caution."
            }
        };

        return Results.Ok(validationResponse);
    }
    catch (Exception ex)
    {
        return Results.Problem(new ValidationResponse
        {
            Success = false,
            Error = $"Validation failed: {ex.Message}",
            Metadata = new MetaData
            {
                RequestId = requestId,
                Timestamp = currentTimestamp,
                ProcessedRecords = request.QueryResults?.Count ?? 0,
                ProcessingTime = DateTime.UtcNow - startTime
            }
        }.ToString());
    }
})
.WithName("ValidateRdf")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
