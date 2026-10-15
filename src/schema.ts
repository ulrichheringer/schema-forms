export interface Schema {
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  enum?: Array<string | number | boolean>;
  format?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  items?: Schema;
}

export type RawValues = Record<string, unknown>;
export interface ValidationResult {
  valid: boolean;
  data: Record<string, unknown>;
  errors: Record<string, string>;
}

export function parseSchema(source: string): Schema {
  const parsed: unknown = JSON.parse(source);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("O schema precisa ser um objeto JSON.");
  const schema = parsed as Schema;
  if (schema.type !== "object" || !schema.properties || typeof schema.properties !== "object") {
    throw new Error("O schema raiz precisa ter type: object e properties.");
  }
  return schema;
}

export function initialValues(schema: Schema, prefix = "", output: RawValues = {}): RawValues {
  Object.entries(schema.properties ?? {}).forEach(([name, property]) => {
    const path = prefix ? prefix + "." + name : name;
    if (property.type === "object") initialValues(property, path, output);
    else if (property.type === "boolean") output[path] = property.default ?? false;
    else if (property.type === "array") output[path] = Array.isArray(property.default) ? property.default.join("\n") : "";
    else output[path] = property.default === undefined ? "" : String(property.default);
  });
  return output;
}

function normalize(schema: Schema, raw: unknown): { value?: unknown; error?: string } {
  const value = raw ?? "";
  if (schema.type === "boolean") return { value: Boolean(value) };
  if (schema.type === "array") {
    const rows = String(value).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (schema.minItems !== undefined && rows.length < schema.minItems) return { error: "Informe pelo menos " + schema.minItems + " itens." };
    if (schema.maxItems !== undefined && rows.length > schema.maxItems) return { error: "Informe no máximo " + schema.maxItems + " itens." };
    const itemType = schema.items?.type ?? "string";
    const items: unknown[] = [];
    for (const row of rows) {
      if (itemType === "number" || itemType === "integer") {
        const item = Number(row);
        if (!Number.isFinite(item) || (itemType === "integer" && !Number.isInteger(item))) {
          return { error: itemType === "integer" ? "Use números inteiros em cada linha." : "Use valores numéricos em cada linha." };
        }
        items.push(item);
      } else items.push(row);
    }
    return { value: items };
  }
  if (schema.type === "number" || schema.type === "integer") {
    if (value === "") return { value: undefined };
    const number = Number(value);
    if (!Number.isFinite(number)) return { error: "Informe um número válido." };
    if (schema.type === "integer" && !Number.isInteger(number)) return { error: "Informe um número inteiro." };
    if (schema.minimum !== undefined && number < schema.minimum) return { error: "O valor mínimo é " + schema.minimum + "." };
    if (schema.maximum !== undefined && number > schema.maximum) return { error: "O valor máximo é " + schema.maximum + "." };
    return { value: number };
  }
  if (schema.type !== "string") return { error: "Tipo não suportado neste campo." };
  const text = String(value);
  if (schema.minLength !== undefined && text.length < schema.minLength) return { error: "Use pelo menos " + schema.minLength + " caracteres." };
  if (schema.maxLength !== undefined && text.length > schema.maxLength) return { error: "Use no máximo " + schema.maxLength + " caracteres." };
  if (schema.enum && !schema.enum.some((choice) => String(choice) === text)) return { error: "Escolha uma opção válida." };
  if (schema.pattern) {
    try {
      if (!new RegExp(schema.pattern).test(text)) return { error: "O valor não corresponde ao formato exigido." };
    } catch {
      return { error: "O padrão de validação do schema é inválido." };
    }
  }
  if (schema.format === "email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return { error: "Informe um e-mail válido." };
  if (schema.format === "uri" && text) {
    try { new URL(text); } catch { return { error: "Informe uma URL válida." }; }
  }
  return { value: text };
}

export function validateData(schema: Schema, raw: RawValues): ValidationResult {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};
  const walk = (node: Schema, prefix: string, target: Record<string, unknown>) => {
    const required = new Set(node.required ?? []);
    Object.entries(node.properties ?? {}).forEach(([name, property]) => {
      const path = prefix ? prefix + "." + name : name;
      if (property.type === "object" && property.properties) {
        const nested: Record<string, unknown> = {};
        walk(property, path, nested);
        if (Object.keys(nested).length) target[name] = nested;
        return;
      }
      const value = raw[path];
      if (required.has(name) && (value === "" || value === undefined || value === null)) {
        errors[path] = "Este campo é obrigatório.";
        return;
      }
      if ((value === "" || value === undefined || value === null) && !required.has(name)) return;
      const result = normalize(property, value);
      if (result.error) errors[path] = result.error;
      else if (result.value !== undefined) target[name] = result.value;
    });
  };
  walk(schema, "", data);
  return { valid: Object.keys(errors).length === 0, data, errors };
}

