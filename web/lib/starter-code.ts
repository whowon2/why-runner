import type { Language } from "@/drizzle/schema";

// Locale-dependent comment text placed above the input and output lines.
export type StarterComments = { read: string; write: string };

// Each template reads two integers from stdin and prints their sum, so the
// student sees the I/O shape the judge expects. Java must stay `Main`: the
// judge compiles `Main.java` and runs `java Main`.
const TEMPLATES: Record<Language, (c: StarterComments) => string> = {
  c: ({ read, write }) => `#include <stdio.h>

int main(void) {
    int a, b;
    // ${read}
    scanf("%d %d", &a, &b);
    // ${write}
    printf("%d\\n", a + b);
    return 0;
}
`,
  cpp: ({ read, write }) => `#include <iostream>

int main() {
    int a, b;
    // ${read}
    std::cin >> a >> b;
    // ${write}
    std::cout << a + b << '\\n';
    return 0;
}
`,
  java: ({ read, write }) => `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        // ${read}
        int a = in.nextInt();
        int b = in.nextInt();
        // ${write}
        System.out.println(a + b);
    }
}
`,
  python: ({ read, write }) => `# ${read}
a, b = map(int, input().split())
# ${write}
print(a + b)
`,
  rust: ({ read, write }) => `use std::io::{self, Read};

fn main() {
    // ${read}
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut numbers = input.split_whitespace().map(|n| n.parse::<i64>().unwrap());
    let a = numbers.next().unwrap();
    let b = numbers.next().unwrap();
    // ${write}
    println!("{}", a + b);
}
`,
  portugol: ({ read, write }) => `programa
{
    funcao inicio()
    {
        inteiro a, b
        // ${read}
        leia(a, b)
        // ${write}
        escreva(a + b, "\\n")
    }
}
`,
};

export function getStarterCode(
  language: Language,
  comments: StarterComments,
): string {
  return TEMPLATES[language](comments);
}

const COMMENT_MARK = "\u0000";

// Whether `code` is `language`'s starter template, whatever text its
// input/output comments hold: the comments follow the UI locale, so the
// untouched pt-BR starter must still count as untouched after switching to
// English.
export function isStarterCode(code: string, language: Language): boolean {
  const template = getStarterCode(language, {
    read: COMMENT_MARK,
    write: COMMENT_MARK,
  }).split("\n");
  const lines = code.split("\n");
  if (lines.length !== template.length) return false;
  return template.every((line, i) => {
    const mark = line.indexOf(COMMENT_MARK);
    if (mark === -1) return lines[i] === line;
    const prefix = line.slice(0, mark);
    return lines[i].startsWith(prefix) && lines[i].length > prefix.length;
  });
}

// Code to show after switching language: when the editor is blank or still
// holds the untouched starter of the previous language, the user's saved
// draft for the new language if there is one, else its starter; otherwise
// the user's code as-is.
export function nextCodeOnLanguageChange(
  code: string,
  prev: Language | null,
  next: Language,
  comments: StarterComments,
  saved?: string | null,
): string {
  const untouched =
    code.trim() === "" || (prev !== null && isStarterCode(code, prev));
  return untouched ? (saved ?? getStarterCode(next, comments)) : code;
}
