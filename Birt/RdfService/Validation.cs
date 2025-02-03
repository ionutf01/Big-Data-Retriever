namespace WebApplication1;

public class Validation
{
    
}
public class SparqlValidationRequest
{
    public List<SparqlQueryResult> QueryResults { get; set; } = new();
}
public enum ViolationSeverity
{
    Critical,
    Warning,
    Info
}

public class ValidationIssue
{
    public string Message { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string FocusNode { get; set; } = string.Empty;
    public ViolationSeverity Severity { get; set; }
    public string SuggestedAction { get; set; } = string.Empty;
}
public class SparqlQueryResult
{
    public string Artist { get; set; } = string.Empty;
    public string ArtistLabel { get; set; } = string.Empty;
    public string BirthDate { get; set; } = string.Empty;
    public string Influence { get; set; } = string.Empty;
    public string InfluenceLabel { get; set; } = string.Empty;
    public string InfluenceTypeLabel { get; set; } = string.Empty;
}

public class ValidationResponse
{
    public bool Success { get; set; }
    public List<ValidationIssue> Results { get; set; } = new();
    public MetaData Metadata { get; set; } = new();
    public string? Error { get; set; }
    // add these alid Records = validResults.Count,
    // TotalRecords = request.QueryResults.Count,
    // SuggestedActions = new
    public  int ValidRecords { get; set; }
    public  int TotalRecords { get; set; }
    public  List<string> SuggestedActions { get; set; } = new();
    
}

public class MetaData
{
    public string RequestId { get; set; } = Guid.NewGuid().ToString();
    public string Timestamp { get; set; } = "2025-02-03 18:03:13"; // Using provided timestamp
    public string UserLogin { get; set; } = "ionutf01";
    public int ProcessedRecords { get; set; }
    public TimeSpan ProcessingTime { get; set; }
}
