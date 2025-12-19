# Automatic Controller Injection

## Overview

Automatic Controller Injection allows you to attach scripts to specific pages automatically during build, without manually editing HTML or JavaScript files.

It is commonly used for tracking, analytics, verification, or other page-specific logic.

---

## Usage

Controllers are configured in the site configuration file.

- Basic Example: inject a tracking controller into specific pages during build.
  ```js
  export default {
    controller: {
      name: 'tracking.ts',  // maps to @landing-page-sdk/assets/controller/tracking.ts
      targets: ['/product', '/checkout'],
    },
  };
  ```
- Targeting by Language and Site: inject only when route, language, and site all match.
  ```js
  export default {
    controller: {
      name: 'analytics.js',
      targets: {
        routes: ['/product'],
        lang: ['en', 'zh'],
        site: ['main'],
      },
    },
  };
  ```
- Inline Script Injection: inject the script directly into `<body>`.
  ```js
  export default {
    controller: {
      name: 'pixel.ts',
      targets: [], // all pages
      injection: {
        type: 'inline',
        appendTo: 'body',  // when inline, target container (default 'head')
      },
    },
  };
  ```
- Control Injection Position:
  ```js
  export default {
    controller: {
      name: 'verification.js',
      targets: ['/register'],
      injection: {
        placement: 'pre',
      },
    },
  };
  ```
  - pre: injected before existing scripts
  - post: injected after existing scripts (default)
- Bundle vs Inline:
  ```js
  export default {
    controller: [
      {
        name: 'shared-logic.ts',
        injection: 'bundle',
      },
      {
        name: 'critical-inline.js',
        injection: {
          type: 'inline',
          bundle: false, // when inline, skip bundling before inject (default true)
        },
      },
    ],
  };
  ```
  - bundle: included in page JavaScript bundle
  - inline: injected directly into HTML

---

## Summary

Automatic Controller Injection provides a simple, declarative way to manage page-level scripts across multiple pages, languages, and sites—without manual edits.
