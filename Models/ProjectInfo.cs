namespace DependencyVisualizer.Models;

public class ProjectInfo
{
  public string Name { get; set; } = string.Empty;
  public string FilePath { get; set; } = string.Empty;
  public string? TargetFramework { get; set; }
  public string? OutputType { get; set; }
  public List<string> Dependencies { get; set; } = new();
  public Dictionary<string, string> Metadata { get; set; } = new();
}
