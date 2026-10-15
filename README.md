# schema-forms

Render a form from a JSON Schema, validate its values, and export the result as JSON. Schemas and form data stay in the browser.

## Run locally

Requires Node.js 20.19 or later.

```sh
npm install
npm run dev
```

Edit the example schema or provide your own, then select **Render**. Fill out the form to see validation results and export the data. Run `npm test` for the parsing and validation tests, or `npm run build` to create the static app in `dist/`.

Supported fields include strings, numbers, integers, booleans, arrays of simple values, and nested objects. The renderer does not implement external references or every JSON Schema keyword.
