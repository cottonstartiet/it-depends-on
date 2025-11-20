using System.Xml.Linq;
using DependencyVisualizer.Models;

namespace DependencyVisualizer.Parsers;

public class ProjectParser
{
  public ProjectInfo ParseProject(string projectPath)
  {
    if (!File.Exists(projectPath))
    {
      throw new FileNotFoundException($"Project file not found: {projectPath}");
    }

    var projectInfo = new ProjectInfo
    {
      Name = Path.GetFileNameWithoutExtension(projectPath),
      FilePath = projectPath
    };

    try
    {
      var doc = XDocument.Load(projectPath);
      var projectDir = Path.GetDirectoryName(projectPath) ?? string.Empty;

      // Parse target framework
      var targetFramework = doc.Descendants("TargetFramework").FirstOrDefault()?.Value;
      if (targetFramework != null)
      {
        projectInfo.TargetFramework = targetFramework;
        projectInfo.Metadata["TargetFramework"] = targetFramework;
      }

      // Parse output type
      var outputType = doc.Descendants("OutputType").FirstOrDefault()?.Value;
      if (outputType != null)
      {
        projectInfo.OutputType = outputType;
        projectInfo.Metadata["OutputType"] = outputType;
      }

      // Parse project references
      foreach (var projectRef in doc.Descendants("ProjectReference"))
      {
        var includePath = projectRef.Attribute("Include")?.Value;
        if (!string.IsNullOrEmpty(includePath))
        {
          var fullPath = Path.GetFullPath(Path.Combine(projectDir, includePath));
          var refName = Path.GetFileNameWithoutExtension(fullPath);
          projectInfo.Dependencies.Add(refName);
        }
      }

      // Parse package references
      var packageRefs = doc.Descendants("PackageReference")
          .Select(p => $"{p.Attribute("Include")?.Value} ({p.Attribute("Version")?.Value})")
          .Where(p => !string.IsNullOrEmpty(p))
          .ToList();

      if (packageRefs.Any())
      {
        projectInfo.Metadata["NuGetPackages"] = string.Join(", ", packageRefs);
      }

      // Parse assembly name
      var assemblyName = doc.Descendants("AssemblyName").FirstOrDefault()?.Value;
      if (assemblyName != null)
      {
        projectInfo.Metadata["AssemblyName"] = assemblyName;
      }
    }
    catch (Exception ex)
    {
      Console.WriteLine($"Warning: Error parsing project {projectPath}: {ex.Message}");
    }

    return projectInfo;
  }
}
