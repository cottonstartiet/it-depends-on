# VS Code Extension to explore dotnet solution dependencies
Create a vs code extension that will allow user to browse and select a C# solution (*.sln) or project (*.csproj) file . On selecting the file, the extension should parse the file and find out all dependencies of the project. In the end display all dependencies in a canvas like interface.

# High Level Requirements
- The vs code extension will allow user to browse and select a C# solution or project file
- on selection the extension will analyze the project references and figure out the dependencies
- Perform this traversal recursively till all the dependencies and their child dependencies are also analyzed
- Once the full graph is created, show the graph on an interactive canvas
- each node in the graph should represent on a project
- user should be able to click on a node in a graph to see the dependencies of that project
- on mouse hover on a node, user should be able to see details of the project. For this extract whatever information is available about the application from the project file

# Low Level Requirements
- Make sure that the traversal is recursive and goes to the last possible level
- graph visualization should be interactive and user should be able to click on graph nodes and move them around
- clicking on a node should highlight the node and the arrows connecting it to the dependencies
- if project A depends on project B, the arrow direction between the nodes should point from A to B (A -> B)
  
# Tech Stack
- The application should be able to run offline
- you can use any third party library you need to display the graph
- Use react if possible, if not possible to use react, use plain html