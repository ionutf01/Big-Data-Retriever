using VDS.RDF;
using VDS.RDF.Parsing;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast")
    .WithOpenApi();

app.MapGet("/rdf", () =>
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
        var triples = graph.Triples.Select(triple => new
        {
            Subject = triple.Subject.ToString(),
            Predicate = triple.Predicate.ToString(),
            Object = triple.Object.ToString()
        });
        // return triples;
        // print triples
        return Results.Ok(triples);
    })
    .WithName("GetRdf")
    .WithOpenApi();

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

app.MapGet("/rdf/visualize", () =>
{
    var graph = new Graph();
    try
    {
        graph.LoadFromFile("Influence_description_ontology.ttl");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error loading file: {ex.Message}");
    }

    var nodes = new HashSet<object>();
    var links = new List<object>();

    foreach (var triple in graph.Triples)
    {
        var subject = triple.Subject.ToString();
        var predicate = triple.Predicate.ToString();
        var obj = triple.Object.ToString();

        // Add nodes
        if (!nodes.Any(n => n.ToString().Contains(subject)))
        {
            nodes.Add(new { id = subject, label = subject, group = "subject" });
        }
        if (!nodes.Any(n => n.ToString().Contains(obj)))
        {
            nodes.Add(new { id = obj, label = obj, group = "object" });
        }

        // Add links
        links.Add(new { source = subject, target = obj, label = predicate });
    }

    return Results.Ok(new { nodes = nodes.ToList(), links });
})
.WithName("VisualizeRdf")
.WithOpenApi();
app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
