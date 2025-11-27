using System;
using System.IO;
using System.Text.Json;
using DependencyVisualizer.Models;

namespace DependencyVisualizer.Services;

public class HtmlGenerator
{
    private const string Placeholder = "__PROJECTS_JSON_PLACEHOLDER__";
    private const string TemplateRelativePath = "Templates\\dependencies_template.html";

    public void GenerateHtml(Dictionary<string, ProjectInfo> graph, string outputPath)
    {
        var projectsJson = SerializeProjects(graph);
        var templateHtml = LoadTemplateHtml();
        if (string.IsNullOrWhiteSpace(templateHtml))
        {
            throw new FileNotFoundException($"HTML template not found at '{TemplateRelativePath}'.");
        }
        var finalHtml = templateHtml.Replace(Placeholder, projectsJson);
        File.WriteAllText(outputPath, finalHtml);
    }

    private string LoadTemplateHtml()
    {
        // Look in output directory first (after build)
        var baseDir = AppContext.BaseDirectory;
        var path = Path.Combine(baseDir, TemplateRelativePath);
        if (!File.Exists(path))
        {
            // Fallback to source relative path (development execution)
            var alt = Path.GetFullPath(TemplateRelativePath);
            if (File.Exists(alt)) path = alt; else return string.Empty;
        }
        return File.ReadAllText(path);
    }

    private string SerializeProjects(Dictionary<string, ProjectInfo> graph)
    {
        var projectDict = new Dictionary<string, object>();
        foreach (var (key, value) in graph)
        {
            projectDict[key] = new
            {
                name = value.Name,
                filePath = value.FilePath,
                dependencies = value.Dependencies,
                metadata = value.Metadata
            };
        }
        return JsonSerializer.Serialize(projectDict, new JsonSerializerOptions { WriteIndented = false });
    }
}
