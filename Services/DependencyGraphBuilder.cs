using DependencyVisualizer.Models;

namespace DependencyVisualizer.Services;

public class DependencyGraphBuilder
{
  public Dictionary<string, ProjectInfo> BuildGraph(List<ProjectInfo> projects)
  {
    var graph = new Dictionary<string, ProjectInfo>(StringComparer.OrdinalIgnoreCase);

    foreach (var project in projects)
    {
      graph[project.Name] = project;
    }

    return graph;
  }

  public List<ProjectInfo> GetDirectDependencies(Dictionary<string, ProjectInfo> graph, string projectName)
  {
    if (!graph.TryGetValue(projectName, out var project))
    {
      return new List<ProjectInfo>();
    }

    var dependencies = new List<ProjectInfo>();
    foreach (var depName in project.Dependencies)
    {
      if (graph.TryGetValue(depName, out var depProject))
      {
        dependencies.Add(depProject);
      }
    }

    return dependencies;
  }

  public HashSet<string> GetAllDependencies(Dictionary<string, ProjectInfo> graph, string projectName)
  {
    var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    CollectDependencies(graph, projectName, visited);
    visited.Remove(projectName); // Remove the starting project itself
    return visited;
  }

  private void CollectDependencies(Dictionary<string, ProjectInfo> graph, string projectName, HashSet<string> visited)
  {
    if (!visited.Add(projectName))
    {
      return; // Already visited, avoid cycles
    }

    if (graph.TryGetValue(projectName, out var project))
    {
      foreach (var dependency in project.Dependencies)
      {
        CollectDependencies(graph, dependency, visited);
      }
    }
  }
}
