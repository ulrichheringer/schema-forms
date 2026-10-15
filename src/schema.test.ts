import { describe, expect, it } from "vitest";
import { initialValues, parseSchema, validateData } from "./schema";

describe("JSON Schema form model", () => {
  it("requires an object root", () => {
    expect(() => parseSchema('{"type":"string"}')).toThrow("type: object");
  });

  it("validates required and email fields and returns normalized data", () => {
    const schema = parseSchema(JSON.stringify({
      type: "object", required: ["email"],
      properties: { email: { type: "string", format: "email" }, age: { type: "integer", minimum: 18 } },
    }));
    const missing = validateData(schema, { email: "", age: "19" });
    expect(missing.errors.email).toContain("obrigatório");
    const invalid = validateData(schema, { email: "nope", age: "19" });
    expect(invalid.errors.email).toContain("e-mail");
    const valid = validateData(schema, { email: "ada@example.org", age: "19" });
    expect(valid.data).toEqual({ email: "ada@example.org", age: 19 });
  });

  it("creates nested values and validates simple array item types", () => {
    const schema = parseSchema(JSON.stringify({ type: "object", properties: {
      contact: { type: "object", required: ["city"], properties: { city: { type: "string" } } },
      scores: { type: "array", items: { type: "integer" }, minItems: 1 },
    } }));
    expect(initialValues(schema)).toHaveProperty("contact.city", "");
    expect(validateData(schema, { "contact.city": "Lisbon", scores: "4\n8" }).data)
      .toEqual({ contact: { city: "Lisbon" }, scores: [4, 8] });
    expect(validateData(schema, { "contact.city": "x", scores: "4.5" }).errors.scores).toContain("inteiro");
  });
});

