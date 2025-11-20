using System.Text.RegularExpressions;
using DependencyVisualizer.Models;

namespace DependencyVisualizer.Parsers;

public class SolutionParser
{
  public List<ProjectInfo> ParseSolution(string solutionPath)
  {
    var projects = new List<ProjectInfo>();
    var solutionDir = Path.GetDirectoryName(solutionPath) ?? string.Empty;

    if (!File.Exists(solutionPath))
    {
      throw new FileNotFoundException($"Solution file not found: {solutionPath}");
    }

    var content = File.ReadAllText(solutionPath);

    // Parse project lines: Project("{...}") = "ProjectName", "Path\To\Project.csproj", "{...}"
    var projectPattern = @"Project\(""\{[^}]+\}""\)\s*=\s*""([^""]+)"",\s*""([^""]+)"",\s*""\{[^}]+\}""";
    var matches = Regex.Matches(content, projectPattern);

    foreach (Match match in matches)
    {
      var projectName = match.Groups[1].Value;
      var projectRelativePath = match.Groups[2].Value;

      // Skip solution folders
      if (projectRelativePath.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase))
      {
        var projectFullPath = Path.GetFullPath(Path.Combine(solutionDir, projectRelativePath));

        if (File.Exists(projectFullPath))
        {
          var projectParser = new ProjectParser();
          var projectInfo = projectParser.ParseProject(projectFullPath);
          projects.Add(projectInfo);
        }
      }
    }

    return projects;
  }
}
