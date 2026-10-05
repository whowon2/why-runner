// Turns a Blockly workspace, in Blockly's JSON serialization format
// (`Blockly.serialization.workspaces.save`), into a Portugol program.
//
// Deliberately does NOT import Blockly: it walks the serialized JSON
// directly, so the exact same function runs in the browser (live "view code"
// panel) and on the server (`createExerciseSubmission`, which regenerates
// the code from the submitted workspace instead of trusting client code).
//
// Only blocks reachable from the single `pt_inicio` start block count —
// loose blocks elsewhere on the canvas are ignored, like Scratch's "when
// green flag clicked".

export interface SerializedBlock {
  type: string;
  id?: string;
  fields?: Record<string, unknown>;
  inputs?: Record<
    string,
    { block?: SerializedBlock; shadow?: SerializedBlock }
  >;
  next?: { block?: SerializedBlock };
  extraState?: Record<string, unknown>;
}

export interface SerializedWorkspace {
  blocks?: { blocks?: SerializedBlock[] };
  variables?: { id: string; name: string; type?: string }[];
}

export type GeneratorErrorKey =
  | "missingStart"
  | "multipleStarts"
  | "emptyProgram"
  | "emptyInput"
  | "undeclaredVariable"
  | "duplicateDeclaration"
  | "unknownBlock";

export interface GeneratorError {
  key: GeneratorErrorKey;
  blockId?: string;
  /** Variable name for variable-related errors. */
  name?: string;
}

export interface GeneratorResult {
  code: string;
  errors: GeneratorError[];
}

export const START_BLOCK = "pt_inicio";

export const PORTUGOL_TYPES = ["inteiro", "real", "cadeia", "logico"] as const;
export type PortugolType = (typeof PORTUGOL_TYPES)[number];

const ARITHMETIC_OPS: Record<string, string> = {
  ADD: "+",
  SUB: "-",
  MUL: "*",
  DIV: "/",
  MOD: "%",
};

const COMPARISON_OPS: Record<string, string> = {
  EQ: "==",
  NEQ: "!=",
  LT: "<",
  LTE: "<=",
  GT: ">",
  GTE: ">=",
};

const LOGIC_OPS: Record<string, string> = { AND: "e", OR: "ou" };

const PORTUGOL_KEYWORDS = new Set([
  "programa",
  "funcao",
  "inicio",
  "inteiro",
  "real",
  "cadeia",
  "caracter",
  "logico",
  "vazio",
  "verdadeiro",
  "falso",
  "se",
  "senao",
  "enquanto",
  "faca",
  "para",
  "pare",
  "retorne",
  "escolha",
  "caso",
  "contrario",
  "const",
  "inclua",
  "biblioteca",
  "leia",
  "escreva",
  "limpa",
  "e",
  "ou",
  "nao",
]);

const INDENT = "  ";

/**
 * Maps a Blockly variable name (which may contain spaces, accents, or a
 * Portugol keyword) to a valid Portugol identifier.
 */
export function toIdentifier(name: string): string {
  let id = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_]/g, "_");
  if (id === "" || /^[0-9]/.test(id)) id = `v_${id}`;
  if (PORTUGOL_KEYWORDS.has(id)) id = `${id}_`;
  return id;
}

function escapeString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

class Generator {
  readonly errors: GeneratorError[] = [];
  private readonly varNames = new Map<string, string>();
  // Innermost scope last; mirrors Portugol's block scoping.
  private readonly scopes: Set<string>[] = [new Set()];

  constructor(workspace: SerializedWorkspace) {
    for (const v of workspace.variables ?? []) {
      this.varNames.set(v.id, toIdentifier(v.name));
    }
  }

  private varName(block: SerializedBlock, field = "VAR"): string | null {
    const raw = block.fields?.[field];
    const id =
      typeof raw === "object" && raw !== null && "id" in raw
        ? String((raw as { id: unknown }).id)
        : typeof raw === "string"
          ? raw
          : null;
    if (!id) {
      this.errors.push({ key: "emptyInput", blockId: block.id });
      return null;
    }
    return this.varNames.get(id) ?? toIdentifier(id);
  }

  private isDeclared(name: string) {
    return this.scopes.some((s) => s.has(name));
  }

  private requireDeclared(name: string, block: SerializedBlock) {
    if (!this.isDeclared(name)) {
      this.errors.push({ key: "undeclaredVariable", blockId: block.id, name });
    }
  }

  private declare(name: string, block: SerializedBlock) {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(name)) {
      this.errors.push({
        key: "duplicateDeclaration",
        blockId: block.id,
        name,
      });
    }
    scope.add(name);
  }

  private inputBlock(block: SerializedBlock, name: string) {
    const input = block.inputs?.[name];
    return input?.block ?? input?.shadow;
  }

  /** Required value input; records an error and emits a placeholder if empty. */
  private value(block: SerializedBlock, name: string, parens = false): string {
    const child = this.inputBlock(block, name);
    if (!child) {
      this.errors.push({ key: "emptyInput", blockId: block.id });
      return "?";
    }
    const code = this.expression(child);
    return parens && isCompound(child) ? `(${code})` : code;
  }

  expression(block: SerializedBlock): string {
    const f = block.fields ?? {};
    switch (block.type) {
      case "pt_numero":
        return String(f.NUM ?? 0);
      case "pt_texto":
        return `"${escapeString(String(f.TEXT ?? ""))}"`;
      case "pt_logico":
        return f.BOOL === "FALSE" ? "falso" : "verdadeiro";
      case "variables_get": {
        const name = this.varName(block);
        if (!name) return "?";
        this.requireDeclared(name, block);
        return name;
      }
      case "pt_aritmetica":
        return `${this.value(block, "A", true)} ${ARITHMETIC_OPS[String(f.OP)] ?? "+"} ${this.value(block, "B", true)}`;
      case "pt_comparacao":
        return `${this.value(block, "A", true)} ${COMPARISON_OPS[String(f.OP)] ?? "=="} ${this.value(block, "B", true)}`;
      case "pt_logica":
        return `${this.value(block, "A", true)} ${LOGIC_OPS[String(f.OP)] ?? "e"} ${this.value(block, "B", true)}`;
      case "pt_nao":
        return `nao ${this.value(block, "A", true)}`;
      default:
        this.errors.push({ key: "unknownBlock", blockId: block.id });
        return "?";
    }
  }

  /** Generates a statement input (e.g. a loop body) in its own scope. */
  private body(
    block: SerializedBlock,
    name: string,
    depth: number,
    preDeclared: string[] = [],
  ): string[] {
    this.scopes.push(new Set(preDeclared));
    const lines = this.statements(this.inputBlock(block, name), depth);
    this.scopes.pop();
    return lines;
  }

  statements(first: SerializedBlock | undefined, depth: number): string[] {
    const lines: string[] = [];
    for (let block = first; block; block = block.next?.block) {
      lines.push(...this.statement(block, depth));
    }
    return lines;
  }

  private statement(block: SerializedBlock, depth: number): string[] {
    const pad = INDENT.repeat(depth);
    const f = block.fields ?? {};

    switch (block.type) {
      case "pt_declarar": {
        const name = this.varName(block);
        if (!name) return [];
        const type = PORTUGOL_TYPES.includes(f.TYPE as PortugolType)
          ? (f.TYPE as PortugolType)
          : "inteiro";
        // Value is optional: `inteiro x` is a valid declaration. Evaluate it
        // before declaring so `inteiro x = x` reports x as undeclared.
        const initial = this.inputBlock(block, "VALUE")
          ? ` = ${this.value(block, "VALUE")}`
          : "";
        this.declare(name, block);
        return [`${pad}${type} ${name}${initial}`];
      }
      case "variables_set": {
        const name = this.varName(block);
        if (!name) return [];
        this.requireDeclared(name, block);
        return [`${pad}${name} = ${this.value(block, "VALUE")}`];
      }
      case "pt_leia": {
        const name = this.varName(block);
        if (!name) return [];
        this.requireDeclared(name, block);
        return [`${pad}leia(${name})`];
      }
      case "pt_escreva": {
        const value = this.value(block, "VALUE");
        const newline = f.NEWLINE === undefined || isTrue(f.NEWLINE);
        return [`${pad}escreva(${value}${newline ? ', "\\n"' : ""})`];
      }
      case "controls_if": {
        const extra = block.extraState ?? {};
        const elseIfCount = Number(extra.elseIfCount ?? 0);
        const lines: string[] = [];
        for (let i = 0; i <= elseIfCount; i++) {
          const keyword = i === 0 ? "se" : "} senao se";
          lines.push(`${pad}${keyword} (${this.value(block, `IF${i}`)}) {`);
          lines.push(...this.body(block, `DO${i}`, depth + 1));
        }
        if (extra.hasElse) {
          lines.push(`${pad}} senao {`);
          lines.push(...this.body(block, "ELSE", depth + 1));
        }
        lines.push(`${pad}}`);
        return lines;
      }
      case "pt_enquanto":
        return [
          `${pad}enquanto (${this.value(block, "COND")}) {`,
          ...this.body(block, "DO", depth + 1),
          `${pad}}`,
        ];
      case "pt_faca_enquanto": {
        const inner = this.body(block, "DO", depth + 1);
        return [
          `${pad}faca {`,
          ...inner,
          `${pad}} enquanto (${this.value(block, "COND")})`,
        ];
      }
      case "pt_para": {
        const name = this.varName(block);
        if (!name) return [];
        const from = this.value(block, "FROM");
        const to = this.value(block, "TO");
        // Reuse the counter if the student already declared it; otherwise
        // declare it in the loop header, scoped to the loop body.
        const declared = this.isDeclared(name);
        const init = declared
          ? `${name} = ${from}`
          : `inteiro ${name} = ${from}`;
        return [
          `${pad}para (${init}; ${name} <= ${to}; ${name}++) {`,
          ...this.body(block, "DO", depth + 1, declared ? [] : [name]),
          `${pad}}`,
        ];
      }
      default:
        this.errors.push({ key: "unknownBlock", blockId: block.id });
        return [];
    }
  }
}

function isTrue(value: unknown) {
  return value === true || value === "TRUE";
}

function isCompound(block: SerializedBlock) {
  return (
    block.type === "pt_aritmetica" ||
    block.type === "pt_comparacao" ||
    block.type === "pt_logica" ||
    block.type === "pt_nao"
  );
}

export function generatePortugol(
  workspace: SerializedWorkspace,
): GeneratorResult {
  const generator = new Generator(workspace);
  const starts = (workspace.blocks?.blocks ?? []).filter(
    (b) => b.type === START_BLOCK,
  );

  if (starts.length === 0) {
    return { code: "", errors: [{ key: "missingStart" }] };
  }
  if (starts.length > 1) {
    generator.errors.push({ key: "multipleStarts" });
  }

  const start = starts[0];
  const body = generator.statements(start.inputs?.BODY?.block, 2);
  if (body.length === 0) {
    generator.errors.push({ key: "emptyProgram", blockId: start.id });
  }

  const code = [
    "programa {",
    `${INDENT}funcao inicio() {`,
    ...body,
    `${INDENT}}`,
    "}",
    "",
  ].join("\n");

  return { code, errors: generator.errors };
}
