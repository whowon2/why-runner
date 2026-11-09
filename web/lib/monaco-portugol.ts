import type * as MonacoApi from "monaco-editor";

/** Monaco language id; matches the `portugol` submission language. */
export const PORTUGOL = "portugol";

const KEYWORDS = [
  "programa",
  "funcao",
  "inicio",
  "se",
  "senao",
  "enquanto",
  "para",
  "faca",
  "escolha",
  "caso",
  "contrario",
  "pare",
  "retorne",
  "const",
  "inclua",
  "biblioteca",
  "e",
  "ou",
  "nao",
];

const TYPES = ["inteiro", "real", "caracter", "cadeia", "logico", "vazio"];

const CONSTANTS = ["verdadeiro", "falso"];

// Portugol Studio's built-in I/O, colored like other languages' builtins.
const BUILTINS = ["escreva", "leia", "limpa"];

/**
 * Registers a Portugol (Portugol Studio dialect) Monarch grammar on the
 * CDN-loaded Monaco, once. Used by `CodeEditor` and `HighlightedCode`, so the
 * editor and read-only views color Portugol the same way. Token names match
 * the rules in `buildMonacoTheme`.
 */
export function registerPortugol(monaco: typeof MonacoApi) {
  if (monaco.languages.getLanguages().some((l) => l.id === PORTUGOL)) return;

  monaco.languages.register({ id: PORTUGOL, extensions: [".por"] });

  monaco.languages.setLanguageConfiguration(PORTUGOL, {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"', notIn: ["string"] },
      { open: "'", close: "'", notIn: ["string"] },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  monaco.languages.setMonarchTokensProvider(PORTUGOL, {
    keywords: KEYWORDS,
    types: TYPES,
    constants: CONSTANTS,
    builtins: BUILTINS,
    tokenizer: {
      root: [
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              "@keywords": "keyword",
              "@types": "type",
              "@constants": "constant",
              "@builtins": "predefined",
              "@default": "identifier",
            },
          },
        ],
        { include: "@whitespace" },
        [/[{}()[\]]/, "@brackets"],
        [/\d+\.\d+([eE][-+]?\d+)?/, "number.float"],
        [/0[xX][0-9a-fA-F]+/, "number.hex"],
        [/\d+/, "number"],
        [/[;,.]/, "delimiter"],
        [/<-|[=!<>]=?|&&|\|\||[+\-*/%^~&|]=?|\+\+|--/, "operator"],
        [/"/, "string", "@string"],
        [/'([^'\\]|\\.)'/, "string"],
      ],
      whitespace: [
        [/[ \t\r\n]+/, ""],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  });
}
