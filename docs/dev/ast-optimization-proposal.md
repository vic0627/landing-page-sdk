# [Proposal] Universal AST-Based Optimization Strategy

#### 1. Executive Summary
The current SDK relies heavily on `jsdom` for HTML manipulation and Regular Expressions (Regex) for string replacement in various build hooks.
*   **JSDOM** is too heavy for simple build-time transformations.
*   **Regex** is fragile and error-prone when handling complex syntax trees (e.g., parsing JS imports or HTML attributes).

This proposal aims to transition the entire build pipeline to **AST-based Static Analysis**, leveraging modern, high-performance parsers to improve build speed, reliability, and maintainability.

---

#### 2. HTML Optimization Strategy
**Target**: Replace `jsdom` and fragile Regex replacements in `redirect` logic and `transform` hooks.
**Tool**: `cheerio`

*   **Why**: `cheerio` implements a subset of core jQuery designed specifically for server-side HTML manipulation. It parses HTML into a lightweight DOM structure without the overhead of a simulated browser environment (no EventLoop, no Layout Engine).
*   **Action Plan**:
    *   Refactor `.core/vite/plugins/redirect.ts` and `.core/utils/browser/dom.ts`.
    *   **Breaking Change**: The `transform(page, window)` hook in `site.config.ts` will be updated to `transform(page, $)`. Users will receive a Cheerio instance instead of a JSDOM Window object.

---

#### 3. Script Optimization Strategy (JS/TS/JSX/TSX)
**Target**: Optimize source code analysis, import rewriting, and virtual module injections.
**Tool**: `oxc-parser` (The Oxidized Compiler)

*   **Why**: Written in Rust, Oxc is significantly faster than Babel or Acorn. It provides native support for TypeScript and JSX/TSX, making it the ideal choice for analyzing user source code in a modern frontend stack.
*   **Action Plan**:
    *   Replace any Regex-based import scanning with Oxc's AST traversal.
    *   Establish Oxc as the standard parser for future features (e.g., i18n optimization).

---

#### 4. Style Optimization Strategy
**Target**: CSS/SCSS processing and class name manipulation.
**Tool**: `PostCSS`

*   **Why**: Standardizing on PostCSS allows us to use a plugin-based architecture for all style transformations, ensuring compatibility with the broader Vite ecosystem.
*   **Action Plan**:
    *   Ensure all internal style injections or modifications go through the PostCSS pipeline rather than string concatenation.
