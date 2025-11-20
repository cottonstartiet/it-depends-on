using DependencyVisualizer.Parsers;
using DependencyVisualizer.Services;

namespace DependencyVisualizer;

class Program
{
  static void Main(string[] args)
  {
    Console.WriteLine("Project Dependencies Visualizer");
    Console.WriteLine("================================\n");

    string inputPath;
    string outputPath; // will set after input path known

    if (args.Length == 0)
    {
      Console.Write("Enter path to a .sln or .csproj file (or press Enter to quit): ");
      inputPath = Console.ReadLine()?.Trim() ?? string.Empty;
      if (string.IsNullOrWhiteSpace(inputPath))
      {
        ShowUsage();
        return;
      }
      // Default output path in same directory as input file
      outputPath = Path.Combine(Path.GetDirectoryName(inputPath) ?? ".", "dependencies.html");
    }
    else
    {
      inputPath = args[0];
      if (args.Length > 1 && !string.IsNullOrWhiteSpace(args[1]))
      {
        outputPath = args[1];
      }
      else
      {
        // Default output path in same directory as input file
        outputPath = Path.Combine(Path.GetDirectoryName(inputPath) ?? ".", "dependencies.html");
      }
    }

    try
    {
      if (!File.Exists(inputPath))
      {
        Console.WriteLine($"Error: File not found: {inputPath}");
        return;
      }

      var extension = Path.GetExtension(inputPath).ToLower();
      var projects = new List<DependencyVisualizer.Models.ProjectInfo>();

      Console.WriteLine($"Parsing: {inputPath}");

      if (extension == ".sln")
      {
        var solutionParser = new SolutionParser();
        projects = solutionParser.ParseSolution(inputPath);
        Console.WriteLine($"Found {projects.Count} projects in solution");
      }
      else if (extension == ".csproj")
      {
        var projectParser = new ProjectParser();
        projects = ParseProjectRecursively(inputPath, projectParser);
        Console.WriteLine($"Parsed {projects.Count} projects (including dependencies)");
      }
      else
      {
        Console.WriteLine("Error: Input must be a .sln or .csproj file");
        return;
      }

      // Build dependency graph
      var graphBuilder = new DependencyGraphBuilder();
      var graph = graphBuilder.BuildGraph(projects);
      Console.WriteLine($"Built dependency graph with {graph.Count} projects");

      // Generate HTML visualization
      var htmlGenerator = new HtmlGenerator();
      htmlGenerator.GenerateHtml(graph, outputPath);

      Console.WriteLine("\nVisualization generated successfully!");
      Console.WriteLine($"Output file: {Path.GetFullPath(outputPath)}");
      Console.WriteLine("\nOpen the HTML file in a browser to view the interactive dependency graph.");
    }
    catch (Exception ex)
    {
      Console.WriteLine($"Error: {ex.Message}");
      if (args.Contains("--verbose") || args.Contains("-v"))
      {
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
      }
    }
  }

  static void ShowUsage()
  {
    Console.WriteLine("Usage:");
    Console.WriteLine("  DependencyVisualizer <input-file> [output-file]");
    Console.WriteLine();
    Console.WriteLine("Arguments:");
    Console.WriteLine("  input-file   Path to a .sln or .csproj file");
    Console.WriteLine("  output-file  Path for the output HTML file (default: dependencies.html in input file directory)");
    Console.WriteLine();
    Console.WriteLine("Examples:");
    Console.WriteLine("  DependencyVisualizer MySolution.sln");
    Console.WriteLine("  DependencyVisualizer MyProject.csproj output.html");
    Console.WriteLine();
    Console.WriteLine("Options:");
    Console.WriteLine("  -v, --verbose  Show detailed error information");
  }

  static List<DependencyVisualizer.Models.ProjectInfo> ParseProjectRecursively(string projectPath, ProjectParser parser)
  {
    var allProjects = new Dictionary<string, DependencyVisualizer.Models.ProjectInfo>(StringComparer.OrdinalIgnoreCase);
    var projectsToProcess = new Queue<string>();
    var projectDir = Path.GetDirectoryName(projectPath) ?? string.Empty;

    projectsToProcess.Enqueue(projectPath);

    while (projectsToProcess.Count > 0)
    {
      var currentPath = projectsToProcess.Dequeue();

      if (!File.Exists(currentPath))
      {
        Console.WriteLine($"Warning: Project file not found: {currentPath}");
        continue;
      }

      var project = parser.ParseProject(currentPath);

      if (allProjects.ContainsKey(project.Name))
      {
        continue; // Already processed
      }

      allProjects[project.Name] = project;
      Console.WriteLine($"  → Parsed: {project.Name}");

      // Queue up dependencies for processing
      var currentProjectDir = Path.GetDirectoryName(currentPath) ?? string.Empty;

      try
      {
        var doc = System.Xml.Linq.XDocument.Load(currentPath);
        foreach (var projectRef in doc.Descendants("ProjectReference"))
        {
          var includePath = projectRef.Attribute("Include")?.Value;
          if (!string.IsNullOrEmpty(includePath))
          {
            var depFullPath = Path.GetFullPath(Path.Combine(currentProjectDir, includePath));
            var depName = Path.GetFileNameWithoutExtension(depFullPath);

            if (!allProjects.ContainsKey(depName))
            {
              projectsToProcess.Enqueue(depFullPath);
            }
          }
        }
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Warning: Error reading dependencies from {currentPath}: {ex.Message}");
      }
    }

    return allProjects.Values.ToList();
  }
}
