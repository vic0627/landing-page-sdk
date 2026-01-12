# [Proposal] Zero-Runtime Overhead i18n (Static Compilation Optimization)

> **Prerequisite**: This proposal depends on the implementation of the [Universal AST-Based Optimization Strategy](./ast-optimization-proposal.md), specifically the adoption of `oxc-parser`.

#### 1. Background & Motivation
The current i18n implementation generates language-specific HTML pages at build time. However, client-side scripts (JavaScript) still rely on `getPageContext()` to fetch the full language pack (JSON) injected into the HTML.
When the volume of site text is large (e.g., thousands of keys), this leads to:
*   **Bloated HTML**: Every page carries the complete JSON payload for that language.
*   **Memory Waste**: The browser is forced to parse and hold a large amount of text that is never used on the current page.

#### 2. Core Goal
Implement **"i18n Key Shaking"**: Precisely analyze which i18n keys are used by each Page Entry during bundling, and retain only those necessary texts in the final output.

#### 3. Architecture

##### A. Development Environment (Dev Mode)
To maintain Developer Experience (DX), we want to avoid recompiling on every text change.
*   **Virtual Module**: Create a `virtual:i18n` module.
*   **Runtime Implementation**: In the Dev Server, this module exports a standard callable function (e.g., `export function t(key) { ... }`). This function dynamically retrieves the text from the full language pack in memory upon invocation.

##### B. Production Environment (Build Mode)
Intervene in the compilation process via the Vite Plugin `transform` hook:
1.  **Static Analysis**:
    *   Use `oxc` (oxc-parser) to parse the Page Entry AST.
    *   Scan for all calls to `t()` or specific APIs and extract string literals as **"Used Keys"**.
2.  **Inlining / Extraction**:
    *   **Strategy 1 (Inlining)**: Directly replace `t('hello')` with the compile-time resolved string `'你好'`. This completely eliminates runtime function calls.
    *   **Strategy 2 (Context Slicing)**: Integrate with the existing `vite-plugin-page-context` flow. Instead of stringifying the full `PageContext`, we filter the `i18n` property to contain only the analyzed "Used Keys" before it is injected into the `<script id="__SDK_PAGE_CTX__">` tag.

#### 4. Complexity & Challenges

##### A. Framework Integration (Vue/React)
Simple AST scanning works for Vanilla JS, but modern frameworks require specialized handling:
*   **Vue**: Must process `.vue` Single File Components (SFC).
    *   Template Interpolation: `{{ t('key') }}`
    *   Script Setup: `const { t } = useI18n()`
*   **React**: Must process `.jsx/.tsx`.
    *   Hooks: `useTranslation()`
    *   JSX Elements: `<div>{t('key')}</div>`

This requires the static analyzer to understand framework-specific syntax and transform logic accordingly, significantly increasing the implementation scope.

##### B. Dynamic Keys
*   *Issue*: Patterns like `t('error.' + code)` cannot be statically analyzed.
*   *Solution*: **Strict Error**. If non-literal arguments are detected, the Plugin will throw a compile error. Developers are enforced to use only static keys in Landing Page contexts.

#### 5. Expected Value
*   **Performance**: Significant reduction in LCP (Largest Contentful Paint) and TBT (Total Blocking Time).
*   **Architectural Leadership**: Achieving a level of compiler optimization comparable to core teams like Next.js / Nuxt.
*   **Resource Savings**: Reduced unnecessary CDN bandwidth usage.
