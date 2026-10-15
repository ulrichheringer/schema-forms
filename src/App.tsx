import { useMemo, useState, type ReactNode } from "react";
import { initialValues, parseSchema, validateData, type RawValues, type Schema } from "./schema";

const example = JSON.stringify({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Criar perfil",
  "description": "Conte um pouco sobre você.",
  "type": "object",
  "required": ["name", "email", "plan"],
  "properties": {
    "name": { "type": "string", "title": "Nome completo", "minLength": 2, "maxLength": 80 },
    "email": { "type": "string", "title": "E-mail", "format": "email" },
    "role": { "type": "string", "title": "Função", "enum": ["Design", "Engenharia", "Produto"] },
    "plan": { "type": "string", "title": "Plano", "enum": ["starter", "team", "studio"] },
    "age": { "type": "integer", "title": "Idade", "minimum": 18, "maximum": 120 },
    "newsletter": { "type": "boolean", "title": "Receber novidades" },
    "tags": { "type": "array", "title": "Interesses", "items": { "type": "string" }, "minItems": 1 }
  }
}, null, 2);

function pathId(path: string) { return path.replaceAll(".", "-"); }

function Fields({ schema, raw, prefix, errors, update }: {
  schema: Schema;
  raw: RawValues;
  prefix: string;
  errors: Record<string, string>;
  update: (key: string, value: unknown) => void;
}): ReactNode {
  return Object.entries(schema.properties ?? {}).map(([name, property]) => {
    const path = prefix ? prefix + "." + name : name;
    const label = property.title ?? name;
    if (property.type === "object" && property.properties) return (
      <fieldset className="nested" key={path}><legend>{label}</legend>{property.description && <p>{property.description}</p>}
        <Fields schema={property} raw={raw} prefix={path} errors={errors} update={update} /></fieldset>
    );
    if (!["string", "number", "integer", "boolean", "array"].includes(property.type ?? "")) return (
      <p className="unsupported" key={path}>{label}: tipo de campo ainda não disponível.</p>
    );
    const id = pathId(path);
    const error = errors[path];
    const descriptionId = property.description ? id + "-description" : undefined;
    const errorId = error ? id + "-error" : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
    if (property.type === "boolean") return <label className="checkbox-field" key={path}>
      <input id={id} type="checkbox" checked={Boolean(raw[path])} onChange={(event) => update(path, event.target.checked)} aria-describedby={describedBy} />
      <span>{label}</span>{property.description && <small id={descriptionId}>{property.description}</small>}
    </label>;

    const control = property.type === "array" ? <textarea id={id} rows={3} value={String(raw[path] ?? "")}
      placeholder="Um item por linha" onChange={(event) => update(path, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} /> :
      property.enum ? <select id={id} value={String(raw[path] ?? "")} onChange={(event) => update(path, event.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={describedBy}><option value="">Escolha uma opção</option>{property.enum.map((choice) =>
          <option key={String(choice)} value={String(choice)}>{String(choice)}</option>)}</select> :
      property.type === "string" && !property.format && (property.maxLength ?? 0) > 120 ?
        <textarea id={id} value={String(raw[path] ?? "")} maxLength={property.maxLength} onChange={(event) => update(path, event.target.value)}
          aria-invalid={Boolean(error)} aria-describedby={describedBy} /> :
      <input id={id} type={property.type === "integer" || property.type === "number" ? "number" : property.format === "email" ? "email" : property.format === "uri" ? "url" : "text"}
        step={property.type === "integer" ? "1" : property.type === "number" ? "any" : undefined}
        min={property.minimum} max={property.maximum} minLength={property.minLength} maxLength={property.maxLength}
        value={String(raw[path] ?? "")} onChange={(event) => update(path, event.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={describedBy} />;
    return <div className="field" key={path}><label htmlFor={id}>{label}{(schema.required ?? []).includes(name) && <span className="required"> *</span>}</label>
      {control}{property.description && <small id={descriptionId}>{property.description}</small>}{error && <small className="field-error" id={errorId}>{error}</small>}</div>;
  });
}

export default function App() {
  const [source, setSource] = useState(example);
  const [schema, setSchema] = useState<Schema | null>(() => parseSchema(example));
  const [raw, setRaw] = useState<RawValues>(() => initialValues(parseSchema(example)));
  const [schemaError, setSchemaError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const validation = useMemo(() => schema ? validateData(schema, raw) : null, [schema, raw]);

  function renderSchema() {
    try {
      const next = parseSchema(source);
      setSchema(next);
      setRaw(initialValues(next));
      setErrors({});
      setSubmitted(null);
      setSchemaError("");
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : "Schema inválido.");
    }
  }

  function submit() {
    if (!schema || !validation) return;
    setErrors(validation.errors);
    if (validation.valid) setSubmitted(validation.data);
    else setSubmitted(null);
  }

  function exportData() {
    if (!submitted) return;
    const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(submitted, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "form-data.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return <main className="app">
    <header className="nav"><a className="brand" href="./"><span>sf</span> schema-forms</a><span>JSON Schema · formulário local</span></header>
    <section className="hero"><p className="eyebrow">DO SCHEMA AO FORMULÁRIO</p><h1>Seus dados, em<br /><em>forma simples.</em></h1><p>Renderize campos a partir de um JSON Schema, valide e exporte o resultado.</p></section>
    <div className="workspace">
      <section className="editor panel"><div className="panel-head"><div><span className="step">01</span><h2>JSON Schema</h2></div><button className="run" onClick={renderSchema}>Renderizar <span aria-hidden="true">→</span></button></div>
        <textarea aria-label="JSON Schema" spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)} />
        <div className="editor-note">{schemaError ? <span role="alert">{schemaError}</span> : <span>Draft 2020-12 · objeto raiz</span>}</div>
      </section>
      <section className="form-panel panel"><div className="panel-head"><div><span className="step">02</span><h2>Formulário renderizado</h2></div><span className="field-count">{schema ? Object.keys(schema.properties ?? {}).length + " campos" : "—"}</span></div>
        {schema ? <div className="form-content">
          <div className="form-heading"><h3>{schema.title ?? "Novo formulário"}</h3>{schema.description && <p>{schema.description}</p>}</div>
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate>
            <Fields schema={schema} raw={raw} prefix="" errors={errors} update={(key, value) => { setRaw((values) => ({ ...values, [key]: value })); setSubmitted(null); }} />
            <button className="submit" type="submit">Validar dados <span aria-hidden="true">→</span></button>
          </form>
          {submitted && <section className="export-result" aria-live="polite"><div className="export-head"><strong><span>✓</span> Dados válidos</strong><button onClick={exportData}>Exportar JSON ↓</button></div><pre>{JSON.stringify(submitted, null, 2)}</pre></section>}
          {!submitted && validation && <p className="form-hint">Campos marcados com * são obrigatórios. Os erros aparecem junto de cada campo.</p>}
        </div> : <div className="empty">Corrija o schema para gerar o formulário.</div>}
      </section>
    </div>
    <footer>Suporte: objetos aninhados, texto, números, booleanos, enums, arrays simples, required e validações comuns.</footer>
  </main>;
}

