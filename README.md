# schema-forms — JSON Schema Form Builder

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=20232A)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-2ea44f?style=flat)](LICENSE)

Render a form from a JSON Schema, validate its values, and export the result as JSON. Schemas and form data stay in the browser.

## Run locally

Requires Node.js 20.19 or later.

```sh
npm install
npm run dev
```

Edit the example schema or provide your own, then select **Render**. Fill out the form to see validation results and export the data. Run `npm test` for the parsing and validation tests, or `npm run build` to create the static app in `dist/`.

Supported fields include strings, numbers, integers, booleans, arrays of simple values, and nested objects. The renderer does not implement external references or every JSON Schema keyword.
