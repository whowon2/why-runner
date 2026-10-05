import { describe, expect, test } from "bun:test";
import {
  generatePortugol,
  type SerializedBlock,
  type SerializedWorkspace,
  toIdentifier,
} from "./portugol-generator";

// --- tiny builders for serialized blocks ---------------------------------

const v = (id: string) => ({ id });

function chain(...blocks: SerializedBlock[]): SerializedBlock | undefined {
  for (let i = blocks.length - 2; i >= 0; i--) {
    blocks[i].next = { block: blocks[i + 1] };
  }
  return blocks[0];
}

function program(
  vars: Record<string, string>,
  ...statements: SerializedBlock[]
): SerializedWorkspace {
  const body = chain(...statements);
  return {
    variables: Object.entries(vars).map(([id, name]) => ({ id, name })),
    blocks: {
      blocks: [
        {
          type: "pt_inicio",
          id: "start",
          inputs: body ? { BODY: { block: body } } : {},
        },
      ],
    },
  };
}

const num = (n: number): SerializedBlock => ({
  type: "pt_numero",
  fields: { NUM: n },
});
const text = (s: string): SerializedBlock => ({
  type: "pt_texto",
  fields: { TEXT: s },
});
const get = (id: string): SerializedBlock => ({
  type: "variables_get",
  id: `get-${id}`,
  fields: { VAR: v(id) },
});
const declare = (
  id: string,
  type: string,
  value?: SerializedBlock,
): SerializedBlock => ({
  type: "pt_declarar",
  id: `decl-${id}`,
  fields: { TYPE: type, VAR: v(id) },
  inputs: value ? { VALUE: { block: value } } : {},
});
const read = (id: string): SerializedBlock => ({
  type: "pt_leia",
  fields: { VAR: v(id) },
});
const write = (value: SerializedBlock, newline = true): SerializedBlock => ({
  type: "pt_escreva",
  fields: { NEWLINE: newline ? "TRUE" : "FALSE" },
  inputs: { VALUE: { block: value } },
});
const binary = (
  type: string,
  op: string,
  a: SerializedBlock,
  b: SerializedBlock,
): SerializedBlock => ({
  type,
  fields: { OP: op },
  inputs: { A: { block: a }, B: { block: b } },
});
const set = (id: string, value: SerializedBlock): SerializedBlock => ({
  type: "variables_set",
  fields: { VAR: v(id) },
  inputs: { VALUE: { block: value } },
});

function wrap(...lines: string[]) {
  return [
    "programa {",
    "  funcao inicio() {",
    ...lines.map((l) => `    ${l}`),
    "  }",
    "}",
    "",
  ].join("\n");
}

// --- tests -------------------------------------------------------------------

describe("generatePortugol", () => {
  test("sum of two numbers read from input", () => {
    const result = generatePortugol(
      program(
        { a: "a", b: "b" },
        declare("a", "inteiro"),
        declare("b", "inteiro"),
        read("a"),
        read("b"),
        write(binary("pt_aritmetica", "ADD", get("a"), get("b"))),
      ),
    );
    expect(result.errors).toEqual([]);
    expect(result.code).toBe(
      wrap(
        "inteiro a",
        "inteiro b",
        "leia(a)",
        "leia(b)",
        'escreva(a + b, "\\n")',
      ),
    );
  });

  test("declaration with initial value, assignment and write without newline", () => {
    const result = generatePortugol(
      program(
        { x: "x" },
        declare("x", "real", num(1.5)),
        set("x", binary("pt_aritmetica", "MUL", get("x"), num(2))),
        write(get("x"), false),
      ),
    );
    expect(result.errors).toEqual([]);
    expect(result.code).toBe(wrap("real x = 1.5", "x = x * 2", "escreva(x)"));
  });

  test("nested expressions are parenthesized", () => {
    const sum = binary("pt_aritmetica", "ADD", num(1), num(2));
    const result = generatePortugol(
      program({}, write(binary("pt_aritmetica", "MUL", sum, num(3)))),
    );
    expect(result.code).toContain('escreva((1 + 2) * 3, "\\n")');
  });

  test("if / else-if / else", () => {
    const ifBlock: SerializedBlock = {
      type: "controls_if",
      extraState: { elseIfCount: 1, hasElse: true },
      inputs: {
        IF0: { block: binary("pt_comparacao", "GT", get("n"), num(0)) },
        DO0: { block: write(text("positivo")) },
        IF1: { block: binary("pt_comparacao", "LT", get("n"), num(0)) },
        DO1: { block: write(text("negativo")) },
        ELSE: { block: write(text("zero")) },
      },
    };
    const result = generatePortugol(
      program({ n: "n" }, declare("n", "inteiro"), read("n"), ifBlock),
    );
    expect(result.errors).toEqual([]);
    expect(result.code).toBe(
      wrap(
        "inteiro n",
        "leia(n)",
        "se (n > 0) {",
        '  escreva("positivo", "\\n")',
        "} senao se (n < 0) {",
        '  escreva("negativo", "\\n")',
        "} senao {",
        '  escreva("zero", "\\n")',
        "}",
      ),
    );
  });

  test("para loop declares its counter when not declared before", () => {
    const loop: SerializedBlock = {
      type: "pt_para",
      fields: { VAR: v("i") },
      inputs: {
        FROM: { block: num(1) },
        TO: { block: get("n") },
        DO: { block: write(get("i")) },
      },
    };
    const result = generatePortugol(
      program({ n: "n", i: "i" }, declare("n", "inteiro"), read("n"), loop),
    );
    expect(result.errors).toEqual([]);
    expect(result.code).toBe(
      wrap(
        "inteiro n",
        "leia(n)",
        "para (inteiro i = 1; i <= n; i++) {",
        '  escreva(i, "\\n")',
        "}",
      ),
    );
  });

  test("para loop reuses an already declared counter", () => {
    const loop: SerializedBlock = {
      type: "pt_para",
      fields: { VAR: v("i") },
      inputs: {
        FROM: { block: num(0) },
        TO: { block: num(2) },
        DO: { block: write(get("i")) },
      },
    };
    const result = generatePortugol(
      program({ i: "i" }, declare("i", "inteiro"), loop),
    );
    expect(result.errors).toEqual([]);
    expect(result.code).toContain("para (i = 0; i <= 2; i++) {");
  });

  test("while and do-while with a counter", () => {
    const cond = binary("pt_comparacao", "LT", get("c"), num(3));
    const inc = set("c", binary("pt_aritmetica", "ADD", get("c"), num(1)));
    const whileLoop: SerializedBlock = {
      type: "pt_enquanto",
      inputs: { COND: { block: cond }, DO: { block: inc } },
    };
    const doWhile: SerializedBlock = {
      type: "pt_faca_enquanto",
      inputs: {
        DO: {
          block: set("c", binary("pt_aritmetica", "SUB", get("c"), num(1))),
        },
        COND: { block: binary("pt_comparacao", "GT", get("c"), num(0)) },
      },
    };
    const result = generatePortugol(
      program({ c: "c" }, declare("c", "inteiro", num(0)), whileLoop, doWhile),
    );
    expect(result.errors).toEqual([]);
    expect(result.code).toBe(
      wrap(
        "inteiro c = 0",
        "enquanto (c < 3) {",
        "  c = c + 1",
        "}",
        "faca {",
        "  c = c - 1",
        "} enquanto (c > 0)",
      ),
    );
  });

  test("logic operators, negation and booleans", () => {
    const expr = binary(
      "pt_logica",
      "AND",
      {
        type: "pt_nao",
        inputs: {
          A: { block: { type: "pt_logico", fields: { BOOL: "FALSE" } } },
        },
      },
      { type: "pt_logico", fields: { BOOL: "TRUE" } },
    );
    const result = generatePortugol(program({}, write(expr)));
    expect(result.code).toContain('escreva((nao falso) e verdadeiro, "\\n")');
  });

  test("strings are escaped", () => {
    const result = generatePortugol(program({}, write(text('diz "oi"\\'))));
    expect(result.code).toContain('escreva("diz \\"oi\\"\\\\", "\\n")');
  });

  test("multi-value input line reads each value separately", () => {
    // Portugol `leia` consumes one whitespace-separated token per call, so
    // "3 4" on a single line still reads into two variables.
    const result = generatePortugol(
      program(
        { a: "a", b: "b" },
        declare("a", "inteiro"),
        declare("b", "inteiro"),
        read("a"),
        read("b"),
      ),
    );
    expect(result.code).toContain("leia(a)\n    leia(b)");
  });

  test("variable names are turned into valid identifiers", () => {
    expect(toIdentifier("número de alunos")).toBe("numero_de_alunos");
    expect(toIdentifier("1x")).toBe("v_1x");
    expect(toIdentifier("se")).toBe("se_");
  });

  describe("errors", () => {
    test("no start block", () => {
      const result = generatePortugol({ blocks: { blocks: [write(num(1))] } });
      expect(result.errors).toEqual([{ key: "missingStart" }]);
    });

    test("empty program", () => {
      const result = generatePortugol(program({}));
      expect(result.errors.map((e) => e.key)).toEqual(["emptyProgram"]);
    });

    test("using an undeclared variable", () => {
      const result = generatePortugol(program({ x: "x" }, read("x")));
      expect(result.errors).toEqual([
        { key: "undeclaredVariable", blockId: undefined, name: "x" },
      ]);
    });

    test("loop counter is not visible after the loop", () => {
      const loop: SerializedBlock = {
        type: "pt_para",
        fields: { VAR: v("i") },
        inputs: { FROM: { block: num(1) }, TO: { block: num(2) } },
      };
      const result = generatePortugol(
        program({ i: "i" }, loop, write(get("i"))),
      );
      expect(result.errors.map((e) => e.key)).toEqual(["undeclaredVariable"]);
    });

    test("empty value input", () => {
      const result = generatePortugol(
        program(
          {},
          { type: "pt_escreva", id: "w", fields: { NEWLINE: "TRUE" } },
        ),
      );
      expect(result.errors).toEqual([{ key: "emptyInput", blockId: "w" }]);
    });

    test("declaring the same variable twice in one scope", () => {
      const result = generatePortugol(
        program({ x: "x" }, declare("x", "inteiro"), declare("x", "real")),
      );
      expect(result.errors.map((e) => e.key)).toEqual(["duplicateDeclaration"]);
    });

    test("unknown block type", () => {
      const result = generatePortugol(
        program({}, { type: "something_else", id: "u" }),
      );
      expect(result.errors).toContainEqual({
        key: "unknownBlock",
        blockId: "u",
      });
    });

    test("loose blocks outside the start block are ignored", () => {
      const ws = program({}, write(num(1)));
      ws.blocks?.blocks?.push(write(num(2)));
      const result = generatePortugol(ws);
      expect(result.errors).toEqual([]);
      expect(result.code).not.toContain("escreva(2");
    });
  });
});
