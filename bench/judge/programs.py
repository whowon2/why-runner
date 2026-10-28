"""Programs shared by the DB-backed judge benchmarks: one "double the input"
solution per language, graded against DOUBLE_IN/DOUBLE_OUT (5 test cases)."""

DOUBLE_IN = ["1", "2", "3", "4", "5"]
DOUBLE_OUT = ["2", "4", "6", "8", "10"]

DOUBLE = {
    "c": '#include <stdio.h>\nint main(){int x;scanf("%d",&x);printf("%d\\n",2*x);return 0;}',
    "cpp": "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<2*x<<std::endl;}",
    "java": "public class Main{public static void main(String[] a){System.out.println(2*new java.util.Scanner(System.in).nextInt());}}",
    "python": "print(2*int(input()))",
    "rust": "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();let x:i64=s.trim().parse().unwrap();println!(\"{}\",2*x);}",
    "portugol": "programa {\n  funcao inicio() {\n    inteiro x\n    leia(x)\n    escreva(x * 2)\n  }\n}",
}

LANGS = ["c", "cpp", "java", "python", "rust", "portugol"]
