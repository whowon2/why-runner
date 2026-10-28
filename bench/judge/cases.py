"""Writes the JSON case files the Rust benches in judge/src/bench.rs read.

    bench/.venv/bin/python bench/judge/cases.py   # -> bench/judge/cases/*.json
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from programs import DOUBLE, DOUBLE_IN, DOUBLE_OUT, LANGS  # noqa: E402

OUT = Path(__file__).parent / "cases"

# ---------------------------------------------------------------- cost ----
# CPU-bound: x = (x*31 + i) % 1000003 for i < n, n read from stdin. Values
# stay below 2^31, so every language's default int is enough.
N = "10000000"
CPU = {
    "c": '#include <stdio.h>\nint main(){int n,x=0;scanf("%d",&n);for(int i=0;i<n;i++)x=(x*31+i)%1000003;printf("%d\\n",x);return 0;}',
    "cpp": "#include <iostream>\nint main(){int n,x=0;std::cin>>n;for(int i=0;i<n;i++)x=(x*31+i)%1000003;std::cout<<x<<std::endl;}",
    "java": "public class Main{public static void main(String[] a){int n=new java.util.Scanner(System.in).nextInt(),x=0;for(int i=0;i<n;i++)x=(x*31+i)%1000003;System.out.println(x);}}",
    "python": "n=int(input())\nx=0\nfor i in range(n):\n    x=(x*31+i)%1000003\nprint(x)",
    "rust": "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();let n:i64=s.trim().parse().unwrap();let mut x:i64=0;for i in 0..n{x=(x*31+i)%1000003;}println!(\"{}\",x);}",
    "portugol": "programa {\n  funcao inicio() {\n    inteiro n, i, x = 0\n    leia(n)\n    para (i = 0; i < n; i++) {\n      x = (x * 31 + i) % 1000003\n    }\n    escreva(x)\n  }\n}",
}
HELLO = {
    "c": '#include <stdio.h>\nint main(){printf("hello\\n");return 0;}',
    "cpp": '#include <iostream>\nint main(){std::cout<<"hello"<<std::endl;}',
    "java": 'public class Main{public static void main(String[] a){System.out.println("hello");}}',
    "python": 'print("hello")',
    "rust": 'fn main(){println!("hello");}',
    "portugol": 'programa {\n  funcao inicio() {\n    escreva("hello")\n  }\n}',
}


def cpu_expected(n=int(N)):
    x = 0
    for i in range(n):
        x = (x * 31 + i) % 1000003
    return str(x)


def programs():
    exp = cpu_expected()
    rows = []
    for lang in LANGS:
        rows.append({"lang": lang, "kind": "hello", "code": HELLO[lang], "input": "", "expected": "hello"})
        rows.append({"lang": lang, "kind": "cpu", "code": CPU[lang], "input": N, "expected": exp})
    return rows


# ------------------------------------------------------------ verdicts ----
# Two programs per (language, intended verdict). The problem is "double the
# input" (5 cases, tokens compare, 1 s limit), as in the concurrency bench.
V = {
    "c": {
        "PASSED": [("plain", DOUBLE["c"]),
                   ("extra-spaces", '#include <stdio.h>\nint main(){int x;scanf("%d",&x);printf("  %d  \\n\\n",2*x);return 0;}')],
        "WRONG_ANSWER": [("off-by-one", '#include <stdio.h>\nint main(){int x;scanf("%d",&x);printf("%d\\n",2*x+1);return 0;}'),
                         ("no-output", "int main(){return 0;}")],
        "TIME_LIMIT_EXCEEDED": [("infinite-loop", "int main(){volatile int x=0;while(1)x++;}"),
                                ("sleep", "#include <unistd.h>\nint main(){sleep(10);return 0;}")],
        "MEMORY_LIMIT_EXCEEDED": [("malloc-fill", '#include <stdlib.h>\n#include <string.h>\nint main(){char*p=malloc(400u<<20);memset(p,1,400u<<20);return p[7];}'),
                                  ("grow", '#include <stdlib.h>\nint main(){for(;;){char*p=malloc(1<<20);for(int i=0;i<(1<<20);i+=4096)p[i]=1;}}')],
        "COMPILATION_ERROR": [("syntax", "int main( { return 0; }"),
                              ("undeclared", "int main(){ return y; }")],
        "RUNTIME_ERROR": [("div-zero", '#include <stdio.h>\nint main(){int x;scanf("%d",&x);printf("%d\\n",x/(x-x));return 0;}'),
                          ("null-deref", "int main(){int*p=0;*p=1;return 0;}")],
    },
    "cpp": {
        "PASSED": [("plain", DOUBLE["cpp"]),
                   ("extra-spaces", "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<\"  \"<<2*x<<\" \\n\\n\";}")],
        "WRONG_ANSWER": [("off-by-one", "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<2*x+1;}"),
                         ("no-output", "int main(){}")],
        "TIME_LIMIT_EXCEEDED": [("infinite-loop", "int main(){volatile int x=0;while(true)x++;}"),
                                ("sleep", "#include <thread>\n#include <chrono>\nint main(){std::this_thread::sleep_for(std::chrono::seconds(10));}")],
        "MEMORY_LIMIT_EXCEEDED": [("vector-grow", "#include <vector>\nint main(){std::vector<int> v;for(;;)v.push_back(1);}"),
                                  ("big-new", "#include <cstring>\nint main(){char*p=new char[400u<<20];std::memset(p,1,400u<<20);return p[3];}")],
        "COMPILATION_ERROR": [("syntax", "int main( {}"),
                              ("type", "#include <string>\nint main(){int x = std::string(\"a\");}")],
        "RUNTIME_ERROR": [("div-zero", "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<x/(x-x);}"),
                          ("throw", "#include <stdexcept>\nint main(){throw std::runtime_error(\"boom\");}")],
    },
    "java": {
        "PASSED": [("plain", DOUBLE["java"]),
                   ("extra-spaces", 'public class Main{public static void main(String[] a){System.out.print("  "+2*new java.util.Scanner(System.in).nextInt()+" \\n\\n");}}')],
        "WRONG_ANSWER": [("off-by-one", "public class Main{public static void main(String[] a){System.out.println(2*new java.util.Scanner(System.in).nextInt()+1);}}"),
                         ("no-output", "public class Main{public static void main(String[] a){}}")],
        "TIME_LIMIT_EXCEEDED": [("infinite-loop", "public class Main{static volatile int x;public static void main(String[] a){while(true)x++;}}"),
                                ("sleep", "public class Main{public static void main(String[] a)throws Exception{Thread.sleep(10000);}}")],
        "MEMORY_LIMIT_EXCEEDED": [("big-array", "public class Main{public static void main(String[] a){int[] v=new int[200_000_000];System.out.println(v.length);}}"),
                                  ("list-grow", "public class Main{public static void main(String[] a){java.util.List<long[]> l=new java.util.ArrayList<>();for(;;)l.add(new long[1<<16]);}}")],
        "COMPILATION_ERROR": [("syntax", "public class Main{public static void main(String[] a){}"),
                              ("type", 'public class Main{public static void main(String[] a){int x="a";}}')],
        "RUNTIME_ERROR": [("div-zero", "public class Main{public static void main(String[] a){int x=new java.util.Scanner(System.in).nextInt();System.out.println(x/(x-x));}}"),
                          ("index", "public class Main{public static void main(String[] a){int[] v=new int[1];System.out.println(v[5]);}}")],
    },
    "python": {
        "PASSED": [("plain", DOUBLE["python"]),
                   ("extra-spaces", "x=int(input())\nprint('  ', 2*x, '  \\n')")],
        "WRONG_ANSWER": [("off-by-one", "print(2*int(input())+1)"),
                         ("no-output", "pass")],
        "TIME_LIMIT_EXCEEDED": [("infinite-loop", "while True:\n    pass"),
                                ("sleep", "import time\ntime.sleep(10)")],
        "MEMORY_LIMIT_EXCEEDED": [("big-list", "a = [0] * (10**9)\nprint(len(a))"),
                                  ("list-grow", "a = []\nwhile True:\n    a.append(' ' * 10**6)")],
        "COMPILATION_ERROR": [("syntax", "print(2*int(input())"),
                              ("indent", "if True:\nprint(1)")],
        "RUNTIME_ERROR": [("div-zero", "x=int(input())\nprint(x//(x-x))"),
                          ("name", "print(undefined_name)")],
    },
    "rust": {
        "PASSED": [("plain", DOUBLE["rust"]),
                   ("extra-spaces", "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();let x:i64=s.trim().parse().unwrap();print!(\"  {}  \\n\\n\",2*x);}")],
        "WRONG_ANSWER": [("off-by-one", "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();let x:i64=s.trim().parse().unwrap();println!(\"{}\",2*x+1);}"),
                         ("no-output", "fn main(){}")],
        "TIME_LIMIT_EXCEEDED": [("infinite-loop", "fn main(){let mut x:u64=1;loop{x=x.wrapping_mul(3).wrapping_add(1);if x==0{println!(\"{}\",x);}}}"),
                                ("sleep", "fn main(){std::thread::sleep(std::time::Duration::from_secs(10));}")],
        "MEMORY_LIMIT_EXCEEDED": [("big-vec", "fn main(){let v=vec![1u8; 2_000_000_000];println!(\"{}\",v[7]);}"),
                                  ("vec-grow", "fn main(){let mut v:Vec<Vec<u8>>=Vec::new();loop{v.push(vec![1u8;1<<20]);}}")],
        "COMPILATION_ERROR": [("syntax", "fn main( {}"),
                              ("type", "fn main(){let x: i32 = \"a\";}")],
        "RUNTIME_ERROR": [("div-zero", "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();let x:i64=s.trim().parse().unwrap();println!(\"{}\",x/(x-x));}"),
                          ("panic", "fn main(){let v:Vec<i32>=vec![];println!(\"{}\",v[3]);}")],
    },
    "portugol": {
        "PASSED": [("plain", DOUBLE["portugol"]),
                   ("extra-spaces", 'programa {\n  funcao inicio() {\n    inteiro x\n    leia(x)\n    escreva("  ", x * 2, "  \\n")\n  }\n}')],
        "WRONG_ANSWER": [("off-by-one", "programa {\n  funcao inicio() {\n    inteiro x\n    leia(x)\n    escreva(x * 2 + 1)\n  }\n}"),
                         ("no-output", "programa {\n  funcao inicio() {\n  }\n}")],
        "TIME_LIMIT_EXCEEDED": [("infinite-loop", "programa {\n  funcao inicio() {\n    inteiro x = 0\n    enquanto (verdadeiro) {\n      x = x + 1\n    }\n  }\n}"),
                                ("nested-loop", "programa {\n  funcao inicio() {\n    inteiro i, j, x = 0\n    para (i = 0; i < 100000; i++) {\n      para (j = 0; j < 100000; j++) {\n        x = (x + j) % 7\n      }\n    }\n    escreva(x)\n  }\n}")],
        "MEMORY_LIMIT_EXCEEDED": [("big-array", "programa {\n  funcao inicio() {\n    inteiro v[200000000]\n    escreva(v[0])\n  }\n}"),
                                  ("big-matrix", "programa {\n  funcao inicio() {\n    inteiro m[20000][20000]\n    escreva(m[0][0])\n  }\n}")],
        "COMPILATION_ERROR": [("syntax", "programa {\n  funcao inicio( {\n  }\n}"),
                              ("undeclared", "programa {\n  funcao inicio() {\n    escreva(y)\n  }\n}")],
        "RUNTIME_ERROR": [("div-zero", "programa {\n  funcao inicio() {\n    inteiro x\n    leia(x)\n    escreva(x / (x - x))\n  }\n}"),
                          ("index", "programa {\n  funcao inicio() {\n    inteiro v[2]\n    escreva(v[5])\n  }\n}")],
    },
}


def verdicts():
    rows = []
    for lang in LANGS:
        for expected, variants in V[lang].items():
            for variant, code in variants:
                rows.append({"lang": lang, "expected": expected, "variant": variant, "code": code,
                             "inputs": DOUBLE_IN, "outputs": DOUBLE_OUT})
    return rows


# --------------------------------------------------------- constraints ----
# (id, lang, rule, params, violates, category, code). "category" groups the
# false-positive traps: token in a string, token in a comment, token as part
# of an identifier, loop keyword in a string/comment.
FORBID_GOTO = '{"constructs":["goto"]}'
FORBID_WHILE = '{"constructs":["while"]}'
REQUIRE_FOR = '{"constructs":["for"]}'
DEPTH1 = '{"maxDepth":1}'

CONSTRAINTS = [
    # --- true violations
    ("c-goto", "c", "forbidden_construct", FORBID_GOTO, True, "real",
     "int main(){int i=0;l: i++; if(i<3) goto l; return 0;}"),
    ("py-while", "python", "forbidden_construct", FORBID_WHILE, True, "real",
     "i=0\nwhile i<3:\n    i+=1"),
    ("java-while", "java", "forbidden_construct", FORBID_WHILE, True, "real",
     "public class Main{public static void main(String[] a){int i=0;while(i<3)i++;}}"),
    ("c-nested", "c", "max_loop_nesting_depth", DEPTH1, True, "real",
     "int main(){for(int i=0;i<3;i++){for(int j=0;j<3;j++){}}return 0;}"),
    ("py-nested", "python", "max_loop_nesting_depth", DEPTH1, True, "real",
     "for i in range(3):\n    for j in range(3):\n        print(i, j)"),
    ("cpp-nested-while", "cpp", "max_loop_nesting_depth", DEPTH1, True, "real",
     "int main(){int i=0;while(i<3){for(int j=0;j<3;j++){}i++;}}"),
    ("rust-nested", "rust", "max_loop_nesting_depth", DEPTH1, True, "real",
     "fn main(){for i in 0..3{for j in 0..3{println!(\"{}{}\",i,j);}}}"),
    ("java-nested", "java", "max_loop_nesting_depth", DEPTH1, True, "real",
     "public class Main{public static void main(String[] a){for(int i=0;i<3;i++){for(int j=0;j<3;j++){}}}}"),
    ("py-missing-for", "python", "required_construct", REQUIRE_FOR, True, "real",
     "i=0\nwhile i<3:\n    i+=1"),
    ("c-missing-for", "c", "required_construct", REQUIRE_FOR, True, "real",
     "int main(){int i=0;while(i<3)i++;return 0;}"),
    # --- clean code, no trap
    ("c-clean", "c", "forbidden_construct", FORBID_GOTO, False, "clean",
     "int main(){for(int i=0;i<3;i++){}return 0;}"),
    ("py-clean", "python", "forbidden_construct", FORBID_WHILE, False, "clean",
     "for i in range(3):\n    print(i)"),
    ("c-flat", "c", "max_loop_nesting_depth", DEPTH1, False, "clean",
     "int main(){for(int i=0;i<3;i++){}for(int j=0;j<3;j++){}return 0;}"),
    ("py-flat", "python", "max_loop_nesting_depth", DEPTH1, False, "clean",
     "for i in range(3):\n    print(i)\nfor j in range(3):\n    print(j)"),
    ("java-has-for", "java", "required_construct", REQUIRE_FOR, False, "clean",
     "public class Main{public static void main(String[] a){for(int i=0;i<3;i++){}}}"),
    ("rust-flat", "rust", "max_loop_nesting_depth", DEPTH1, False, "clean",
     "fn main(){for i in 0..3{println!(\"{}\",i);}}"),
    # --- traps: rule token inside a string literal
    ("c-goto-string", "c", "forbidden_construct", FORBID_GOTO, False, "string",
     '#include <stdio.h>\nint main(){printf("never use goto\\n");return 0;}'),
    ("py-while-string", "python", "forbidden_construct", FORBID_WHILE, False, "string",
     "print('while loops are banned here')"),
    ("java-while-string", "java", "forbidden_construct", FORBID_WHILE, False, "string",
     'public class Main{public static void main(String[] a){System.out.println("while");}}'),
    ("py-for-string", "python", "required_construct", REQUIRE_FOR, True, "string",
     "i=0\nprint('for')\nwhile i<3:\n    i+=1"),
    ("c-nested-string", "c", "max_loop_nesting_depth", DEPTH1, False, "string",
     '#include <stdio.h>\nint main(){for(int i=0;i<3;i++){printf("for(;;){ for(;;){} }\\n");}return 0;}'),
    # --- traps: rule token inside a comment
    ("c-goto-comment", "c", "forbidden_construct", FORBID_GOTO, False, "comment",
     "int main(){ /* no goto here */ return 0; }"),
    ("py-while-comment", "python", "forbidden_construct", FORBID_WHILE, False, "comment",
     "# a while loop would also work\nfor i in range(3):\n    print(i)"),
    ("cpp-while-comment", "cpp", "forbidden_construct", FORBID_WHILE, False, "comment",
     "// while is forbidden\nint main(){for(int i=0;i<3;i++){}}"),
    ("c-for-comment", "c", "required_construct", REQUIRE_FOR, True, "comment",
     "// TODO: use a for loop\nint main(){int i=0;while(i<3)i++;return 0;}"),
    ("py-nested-comment", "python", "max_loop_nesting_depth", DEPTH1, False, "comment",
     "for i in range(3):\n    # for j in range(3):\n    print(i)"),
    ("c-nested-comment", "c", "max_loop_nesting_depth", DEPTH1, False, "comment",
     "int main(){for(int i=0;i<3;i++){ /* for(;;){} */ }return 0;}"),
    # --- traps: token as part of a longer identifier
    ("c-goto-ident", "c", "forbidden_construct", FORBID_GOTO, False, "identifier",
     "int gotoNext(int x){return x+1;}\nint main(){return gotoNext(0)-1;}"),
    ("py-while-ident", "python", "forbidden_construct", FORBID_WHILE, False, "identifier",
     "meanwhile = 3\nprint(meanwhile)"),
    ("java-for-ident", "java", "required_construct", REQUIRE_FOR, True, "identifier",
     "public class Main{public static void main(String[] a){int format=0;while(format<3)format++;}}"),
]


def constraints():
    return [{"id": i, "lang": lang, "rule_type": rule, "params": params, "violates": v,
             "category": cat, "code": code} for i, lang, rule, params, v, cat, code in CONSTRAINTS]


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, rows in [("programs", programs()), ("verdicts", verdicts()), ("constraints", constraints())]:
        (OUT / f"{name}.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False))
        print(name, len(rows))
