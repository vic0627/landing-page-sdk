# Landing Page SDK

<!-- nx configuration start-->

## General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `npx nx` (i.e. `npx nx run`, `npx nx run-many`, `npx nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

## Required Context Files

To function properly, this agent must load the following documentation files as part of its initialization context. These files provide essential information about the workspace structure, usage, and task semantics.

- `README.md`: Workspace overview and high-level context
- `docs/client/README.md`: Frontend structure, usage patterns, and build instructions

> Note: These files may contain links or references to additional files (e.g., configs, scripts, submodules).
> The agent should also recursively include any referenced files within these documents if the context is relevant.

### Inclusion Rule

- Any file listed here must be included at startup
- If a file includes references (e.g., via markdown links, file paths, or embedded code blocks), those referenced files must also be included
- The agent must be capable of parsing the above markdown files and expanding their dependencies as needed

## Guidelines for working with Chrome DevTools

- When accessing URLs under the dev/preview server, the agent must derive the correct route structure based on the project layout (e.g. `i18n`, `sites`) and the client documentation context. The root path (`/`) often does not serve any content and may result in access failures if used directly.
