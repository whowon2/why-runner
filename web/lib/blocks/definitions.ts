// Blockly block definitions and toolbox for block-mode exercises. Client
// only (imports Blockly). Every block type here must be handled by
// `portugol-generator.ts`, which is what actually turns them into code.

import * as Blockly from "blockly/core";
import { START_BLOCK } from "./portugol-generator";

export interface BlockLabels {
  start: string;
  declare: string;
  read: string;
  write: string;
  repeatWhile: string;
  countWith: string;
  doLabel: string;
  types: { inteiro: string; real: string; cadeia: string; logico: string };
  boolTrue: string;
  boolFalse: string;
  and: string;
  or: string;
  not: string;
  mod: string;
  createVariable: string;
  categories: {
    variables: string;
    io: string;
    decisions: string;
    loops: string;
    values: string;
  };
}

export const VARIABLES_CATEGORY = "PT_VARIABLES";
const CREATE_VARIABLE_BUTTON = "PT_CREATE_VARIABLE";

// Colours (Blockly hue values) grouped by category.
const HUE = {
  start: 45,
  variables: 330,
  io: 160,
  decisions: 210,
  loops: 120,
  values: 230,
};

/**
 * (Re)registers every block with labels in the current locale. Safe to call
 * again on locale change: later definitions overwrite earlier ones.
 */
export function defineBlocks(l: BlockLabels) {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: START_BLOCK,
      message0: `${l.start} %1 %2`,
      args0: [
        { type: "input_dummy" },
        { type: "input_statement", name: "BODY" },
      ],
      colour: HUE.start,
    },
    {
      type: "pt_declarar",
      message0: l.declare,
      args0: [
        { type: "field_variable", name: "VAR", variable: null },
        {
          type: "field_dropdown",
          name: "TYPE",
          options: [
            [l.types.inteiro, "inteiro"],
            [l.types.real, "real"],
            [l.types.cadeia, "cadeia"],
            [l.types.logico, "logico"],
          ],
        },
        { type: "input_value", name: "VALUE" },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: HUE.variables,
    },
    {
      type: "pt_leia",
      message0: l.read,
      args0: [{ type: "field_variable", name: "VAR", variable: null }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.io,
    },
    {
      type: "pt_escreva",
      message0: l.write,
      args0: [
        { type: "input_value", name: "VALUE" },
        { type: "field_checkbox", name: "NEWLINE", checked: true },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: HUE.io,
    },
    {
      type: "pt_enquanto",
      message0: `${l.repeatWhile} %1`,
      args0: [{ type: "input_value", name: "COND", check: "Boolean" }],
      message1: `${l.doLabel} %1`,
      args1: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.loops,
    },
    {
      type: "pt_faca_enquanto",
      message0: `${l.doLabel} %1`,
      args0: [{ type: "input_statement", name: "DO" }],
      message1: `${l.repeatWhile} %1`,
      args1: [{ type: "input_value", name: "COND", check: "Boolean" }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.loops,
    },
    {
      type: "pt_para",
      message0: l.countWith,
      args0: [
        { type: "field_variable", name: "VAR", variable: null },
        { type: "input_value", name: "FROM", check: "Number" },
        { type: "input_value", name: "TO", check: "Number" },
      ],
      message1: `${l.doLabel} %1`,
      args1: [{ type: "input_statement", name: "DO" }],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: HUE.loops,
    },
    {
      type: "pt_numero",
      message0: "%1",
      args0: [{ type: "field_number", name: "NUM", value: 0 }],
      output: "Number",
      colour: HUE.values,
    },
    {
      type: "pt_texto",
      message0: "“ %1 ”",
      args0: [{ type: "field_input", name: "TEXT", text: "" }],
      output: "String",
      colour: HUE.values,
    },
    {
      type: "pt_logico",
      message0: "%1",
      args0: [
        {
          type: "field_dropdown",
          name: "BOOL",
          options: [
            [l.boolTrue, "TRUE"],
            [l.boolFalse, "FALSE"],
          ],
        },
      ],
      output: "Boolean",
      colour: HUE.values,
    },
    {
      type: "pt_aritmetica",
      message0: "%1 %2 %3",
      args0: [
        { type: "input_value", name: "A" },
        {
          type: "field_dropdown",
          name: "OP",
          options: [
            ["+", "ADD"],
            ["−", "SUB"],
            ["×", "MUL"],
            ["÷", "DIV"],
            [l.mod, "MOD"],
          ],
        },
        { type: "input_value", name: "B" },
      ],
      inputsInline: true,
      output: "Number",
      colour: HUE.values,
    },
    {
      type: "pt_comparacao",
      message0: "%1 %2 %3",
      args0: [
        { type: "input_value", name: "A" },
        {
          type: "field_dropdown",
          name: "OP",
          options: [
            ["=", "EQ"],
            ["≠", "NEQ"],
            ["<", "LT"],
            ["≤", "LTE"],
            [">", "GT"],
            ["≥", "GTE"],
          ],
        },
        { type: "input_value", name: "B" },
      ],
      inputsInline: true,
      output: "Boolean",
      colour: HUE.values,
    },
    {
      type: "pt_logica",
      message0: "%1 %2 %3",
      args0: [
        { type: "input_value", name: "A", check: "Boolean" },
        {
          type: "field_dropdown",
          name: "OP",
          options: [
            [l.and, "AND"],
            [l.or, "OR"],
          ],
        },
        { type: "input_value", name: "B", check: "Boolean" },
      ],
      inputsInline: true,
      output: "Boolean",
      colour: HUE.values,
    },
    {
      type: "pt_nao",
      message0: `${l.not} %1`,
      args0: [{ type: "input_value", name: "A", check: "Boolean" }],
      output: "Boolean",
      colour: HUE.values,
    },
  ]);
}

export function buildToolbox(
  l: BlockLabels,
): Blockly.utils.toolbox.ToolboxDefinition {
  const block = (type: string, extra: Record<string, unknown> = {}) => ({
    kind: "block",
    type,
    ...extra,
  });
  const number = (n: number) => ({
    block: { type: "pt_numero", fields: { NUM: n } },
  });

  return {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: l.categories.variables,
        colour: String(HUE.variables),
        custom: VARIABLES_CATEGORY,
      },
      {
        kind: "category",
        name: l.categories.io,
        colour: String(HUE.io),
        contents: [
          block("pt_leia"),
          block("pt_escreva", {
            inputs: { VALUE: { shadow: { type: "pt_texto" } } },
          }),
        ],
      },
      {
        kind: "category",
        name: l.categories.decisions,
        colour: String(HUE.decisions),
        contents: [
          block("controls_if"),
          block("controls_if", { extraState: { hasElse: true } }),
        ],
      },
      {
        kind: "category",
        name: l.categories.loops,
        colour: String(HUE.loops),
        contents: [
          block("pt_enquanto"),
          block("pt_para", { inputs: { FROM: number(1), TO: number(10) } }),
          block("pt_faca_enquanto"),
        ],
      },
      {
        kind: "category",
        name: l.categories.values,
        colour: String(HUE.values),
        contents: [
          block("pt_numero"),
          block("pt_texto"),
          block("pt_logico"),
          block("pt_aritmetica"),
          block("pt_comparacao"),
          block("pt_logica"),
          block("pt_nao"),
        ],
      },
    ],
  };
}

/**
 * Variables flyout: a "create variable" button, then declare / set / get /
 * read blocks for the most recently created variable (Blockly's own
 * VARIABLE category would also offer blocks the generator can't handle).
 */
export function registerVariablesCategory(
  workspace: Blockly.WorkspaceSvg,
  l: BlockLabels,
) {
  workspace.registerButtonCallback(CREATE_VARIABLE_BUTTON, (button) => {
    Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
  });

  workspace.registerToolboxCategoryCallback(VARIABLES_CATEGORY, (ws) => {
    const items: Blockly.utils.toolbox.FlyoutItemInfoArray = [
      {
        kind: "button",
        text: l.createVariable,
        callbackkey: CREATE_VARIABLE_BUTTON,
      },
    ];
    const variables = ws.getVariableMap().getAllVariables();
    if (variables.length === 0) return items;

    const last = variables[variables.length - 1];
    const field = { VAR: { name: last.getName() } };
    items.push(
      { kind: "block", type: "pt_declarar", fields: field },
      {
        kind: "block",
        type: "variables_set",
        fields: field,
        inputs: { VALUE: { shadow: { type: "pt_numero" } } },
      },
      { kind: "block", type: "pt_leia", fields: field },
    );
    for (const variable of variables) {
      items.push({
        kind: "block",
        type: "variables_get",
        fields: { VAR: { name: variable.getName() } },
      });
    }
    return items;
  });
}
