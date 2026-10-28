"""Hand-written, independent solutions for the plagiarism benchmark: four
problems x three languages x three "authors" written in different styles.
Pairs of solutions to the same problem in the same language are the hard
negatives (similar by necessity, not copied).

Problems
  sum_max  read n and n integers, print their sum and their maximum
  primes   read n, print how many primes are <= n
  fib      read n, print the n-th Fibonacci number mod 1_000_000_007
  sort     read n and n integers, print them in ascending order (own sort)
"""

S = {}

# ------------------------------------------------------------------ python
S["sum_max", "python"] = [
    '''# reads the list and prints sum and max
def read_numbers():
    n = int(input())
    return [int(x) for x in input().split()][:n]


def summarize(values):
    total = 0
    biggest = values[0]
    for v in values:
        total += v
        if v > biggest:
            biggest = v
    return total, biggest


def main():
    values = read_numbers()
    total, biggest = summarize(values)
    print(total, biggest)


main()
''',
    '''import sys


def parse(data):
    n = int(data[0])
    return list(map(int, data[1:1 + n]))


def solve(nums):
    # built-ins do the work
    return sum(nums), max(nums)


def main():
    nums = parse(sys.stdin.read().split())
    s, m = solve(nums)
    print(s, m)


if __name__ == "__main__":
    main()
''',
    '''def ler():
    n = int(input())
    lista = []
    i = 0
    partes = input().split()
    while i < n:
        lista.append(int(partes[i]))
        i += 1
    return lista


def maior(lista):
    m = lista[0]
    for x in lista[1:]:
        m = x if x > m else m
    return m


def soma(lista):
    s = 0
    for x in lista:
        s = s + x
    return s


lista = ler()
print(soma(lista), maior(lista))
''',
]

S["primes", "python"] = [
    '''def is_prime(k):
    if k < 2:
        return False
    d = 2
    while d * d <= k:
        if k % d == 0:
            return False
        d += 1
    return True


def count_primes(n):
    count = 0
    for k in range(2, n + 1):
        if is_prime(k):
            count += 1
    return count


n = int(input())
print(count_primes(n))
''',
    '''# sieve of eratosthenes
def sieve(limit):
    marks = [True] * (limit + 1)
    marks[0] = False
    if limit >= 1:
        marks[1] = False
    p = 2
    while p * p <= limit:
        if marks[p]:
            for q in range(p * p, limit + 1, p):
                marks[q] = False
        p += 1
    return marks


def main():
    limit = int(input())
    print(sum(1 for ok in sieve(limit) if ok))


main()
''',
    '''import math


def primo(x):
    if x <= 1:
        return False
    if x <= 3:
        return True
    if x % 2 == 0 or x % 3 == 0:
        return False
    for d in range(5, int(math.sqrt(x)) + 1, 6):
        if x % d == 0 or x % (d + 2) == 0:
            return False
    return True


total = 0
n = int(input())
for x in range(n + 1):
    if primo(x):
        total += 1
print(total)
''',
]

S["fib", "python"] = [
    '''MOD = 1000000007


def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, (a + b) % MOD
    return a


def main():
    n = int(input())
    print(fib(n))


main()
''',
    '''# matrix exponentiation, O(log n)
M = 10**9 + 7


def mul(x, y):
    return [[(x[0][0] * y[0][0] + x[0][1] * y[1][0]) % M, (x[0][0] * y[0][1] + x[0][1] * y[1][1]) % M],
            [(x[1][0] * y[0][0] + x[1][1] * y[1][0]) % M, (x[1][0] * y[0][1] + x[1][1] * y[1][1]) % M]]


def power(base, e):
    result = [[1, 0], [0, 1]]
    while e > 0:
        if e & 1:
            result = mul(result, base)
        base = mul(base, base)
        e >>= 1
    return result


n = int(input())
print(power([[1, 1], [1, 0]], n)[0][1])
''',
    '''def fibonacci(n):
    memo = [0] * (n + 2)
    memo[1] = 1
    i = 2
    while i <= n:
        memo[i] = (memo[i - 1] + memo[i - 2]) % 1000000007
        i = i + 1
    return memo[n]


entrada = int(input())
resposta = fibonacci(entrada)
print(resposta)
''',
]

S["sort", "python"] = [
    '''def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr


def main():
    n = int(input())
    arr = list(map(int, input().split()))[:n]
    print(*bubble_sort(arr))


main()
''',
    '''def merge(left, right):
    out = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out


def merge_sort(xs):
    # split in halves until single elements
    if len(xs) <= 1:
        return xs
    mid = len(xs) // 2
    return merge(merge_sort(xs[:mid]), merge_sort(xs[mid:]))


input()
print(" ".join(str(x) for x in merge_sort([int(t) for t in input().split()])))
''',
    '''def ordenar(v):
    for i in range(1, len(v)):
        chave = v[i]
        j = i - 1
        while j >= 0 and v[j] > chave:
            v[j + 1] = v[j]
            j -= 1
        v[j + 1] = chave


n = int(input())
v = [int(x) for x in input().split()]
ordenar(v)
for i in range(n):
    print(v[i], end=" " if i < n - 1 else "\\n")
''',
]

# ----------------------------------------------------------------------- c
S["sum_max", "c"] = [
    '''#include <stdio.h>

/* reads n numbers and prints sum and max */
long sum_of(int *v, int n) {
    long total = 0;
    for (int i = 0; i < n; i++) {
        total += v[i];
    }
    return total;
}

int max_of(int *v, int n) {
    int best = v[0];
    for (int i = 1; i < n; i++) {
        if (v[i] > best) {
            best = v[i];
        }
    }
    return best;
}

int main() {
    int n;
    int v[1000];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    printf("%ld %d\\n", sum_of(v, n), max_of(v, n));
    return 0;
}
''',
    '''#include <stdio.h>
#include <limits.h>

int main() {
    int n, x;
    long s = 0;
    int m = INT_MIN;
    scanf("%d", &n);
    while (n--) {
        scanf("%d", &x);
        s += x;
        if (x > m) m = x;
    }
    printf("%ld %d\\n", s, m);
    return 0;
}
''',
    '''#include <stdio.h>
#include <stdlib.h>

void ler(int *vetor, int tamanho) {
    int i;
    for (i = 0; i < tamanho; i++)
        scanf("%d", vetor + i);
}

void calcular(int *vetor, int tamanho, long *soma, int *maior) {
    int i;
    *soma = 0;
    *maior = vetor[0];
    for (i = 0; i < tamanho; i++) {
        *soma = *soma + vetor[i];
        if (vetor[i] > *maior)
            *maior = vetor[i];
    }
}

int main(void) {
    int tamanho, maior;
    long soma;
    scanf("%d", &tamanho);
    int *vetor = malloc(sizeof(int) * tamanho);
    ler(vetor, tamanho);
    calcular(vetor, tamanho, &soma, &maior);
    printf("%ld %d\\n", soma, maior);
    free(vetor);
    return 0;
}
''',
]

S["primes", "c"] = [
    '''#include <stdio.h>

int is_prime(int k) {
    if (k < 2) {
        return 0;
    }
    for (int d = 2; d * d <= k; d++) {
        if (k % d == 0) {
            return 0;
        }
    }
    return 1;
}

int count_primes(int n) {
    int count = 0;
    for (int k = 2; k <= n; k++) {
        if (is_prime(k)) {
            count++;
        }
    }
    return count;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", count_primes(n));
    return 0;
}
''',
    '''#include <stdio.h>
#include <string.h>

char composite[10000001];

int main() {
    int limit, total = 0;
    scanf("%d", &limit);
    memset(composite, 0, sizeof(composite));
    for (long p = 2; p <= limit; p++) {
        if (!composite[p]) {
            total++;
            /* cross out multiples */
            for (long q = p * p; q <= limit; q += p)
                composite[q] = 1;
        }
    }
    printf("%d\\n", total);
    return 0;
}
''',
    '''#include <stdio.h>
#include <math.h>

int primo(int x) {
    int d, r;
    if (x <= 1) return 0;
    if (x == 2) return 1;
    if (x % 2 == 0) return 0;
    r = (int) sqrt((double) x);
    for (d = 3; d <= r; d += 2)
        if (x % d == 0) return 0;
    return 1;
}

int main(void) {
    int n, x, quantos = 0;
    scanf("%d", &n);
    for (x = 0; x <= n; x++)
        if (primo(x)) quantos++;
    printf("%d\\n", quantos);
    return 0;
}
''',
]

S["fib", "c"] = [
    '''#include <stdio.h>
#define MOD 1000000007LL

long long fib(int n) {
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        long long next = (a + b) % MOD;
        a = b;
        b = next;
    }
    return a;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%lld\\n", fib(n));
    return 0;
}
''',
    '''#include <stdio.h>

typedef unsigned long long u64;
const u64 M = 1000000007ULL;

/* 2x2 matrix product, in place into r */
void mul(u64 a[2][2], u64 b[2][2], u64 r[2][2]) {
    u64 t[2][2];
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            t[i][j] = (a[i][0] * b[0][j] + a[i][1] * b[1][j]) % M;
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            r[i][j] = t[i][j];
}

int main() {
    long long e;
    u64 base[2][2] = {{1, 1}, {1, 0}}, res[2][2] = {{1, 0}, {0, 1}};
    scanf("%lld", &e);
    while (e > 0) {
        if (e & 1) mul(res, base, res);
        mul(base, base, base);
        e >>= 1;
    }
    printf("%llu\\n", res[0][1]);
    return 0;
}
''',
    '''#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n, i;
    long long *memo;
    scanf("%d", &n);
    memo = calloc(n + 2, sizeof(long long));
    memo[1] = 1;
    for (i = 2; i <= n; i++)
        memo[i] = (memo[i - 1] + memo[i - 2]) % 1000000007;
    printf("%lld\\n", memo[n]);
    free(memo);
    return 0;
}
''',
]

S["sort", "c"] = [
    '''#include <stdio.h>

void bubble_sort(int *arr, int n) {
    for (int i = 0; i < n; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
                swapped = 1;
            }
        }
        if (!swapped) {
            break;
        }
    }
}

void print_all(int *arr, int n) {
    for (int i = 0; i < n; i++) {
        printf("%d%c", arr[i], i == n - 1 ? '\\n' : ' ');
    }
}

int main() {
    int n, arr[1000];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    bubble_sort(arr, n);
    print_all(arr, n);
    return 0;
}
''',
    '''#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    int x = *(const int *) a, y = *(const int *) b;
    return (x > y) - (x < y);
}

int main() {
    int n;
    scanf("%d", &n);
    int *v = malloc(n * sizeof *v);
    for (int i = 0; i < n; i++) scanf("%d", &v[i]);
    /* library quicksort */
    qsort(v, n, sizeof *v, cmp);
    for (int i = 0; i < n; i++) printf(i ? " %d" : "%d", v[i]);
    printf("\\n");
    free(v);
    return 0;
}
''',
    '''#include <stdio.h>

void ordenar(int v[], int n) {
    int i, j, chave;
    for (i = 1; i < n; i++) {
        chave = v[i];
        j = i - 1;
        while (j >= 0 && v[j] > chave) {
            v[j + 1] = v[j];
            j = j - 1;
        }
        v[j + 1] = chave;
    }
}

int main(void) {
    int n, i, v[1000];
    scanf("%d", &n);
    for (i = 0; i < n; i++)
        scanf("%d", &v[i]);
    ordenar(v, n);
    for (i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%d", v[i]);
    }
    printf("\\n");
    return 0;
}
''',
]

# -------------------------------------------------------------------- java
S["sum_max", "java"] = [
    '''import java.util.Scanner;

public class Main {
    // sum and maximum of the input
    static long sumOf(int[] v) {
        long total = 0;
        for (int x : v) {
            total += x;
        }
        return total;
    }

    static int maxOf(int[] v) {
        int best = v[0];
        for (int x : v) {
            if (x > best) {
                best = x;
            }
        }
        return best;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] v = new int[n];
        for (int i = 0; i < n; i++) {
            v[i] = in.nextInt();
        }
        System.out.println(sumOf(v) + " " + maxOf(v));
    }
}
''',
    '''import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        long s = 0;
        int m = Integer.MIN_VALUE;
        while (n-- > 0) {
            int x = Integer.parseInt(st.nextToken());
            s += x;
            m = Math.max(m, x);
        }
        System.out.println(s + " " + m);
    }
}
''',
    '''import java.util.*;

public class Main {
    static int[] ler(Scanner sc) {
        int tamanho = sc.nextInt();
        int[] vetor = new int[tamanho];
        int i = 0;
        while (i < tamanho) {
            vetor[i] = sc.nextInt();
            i++;
        }
        return vetor;
    }

    static int maior(int[] vetor) {
        int m = vetor[0];
        for (int i = 1; i < vetor.length; i++)
            m = vetor[i] > m ? vetor[i] : m;
        return m;
    }

    static long soma(int[] vetor) {
        return Arrays.stream(vetor).asLongStream().sum();
    }

    public static void main(String[] args) {
        int[] vetor = ler(new Scanner(System.in));
        System.out.println(soma(vetor) + " " + maior(vetor));
    }
}
''',
]

S["primes", "java"] = [
    '''import java.util.Scanner;

public class Main {
    static boolean isPrime(int k) {
        if (k < 2) {
            return false;
        }
        for (int d = 2; d * d <= k; d++) {
            if (k % d == 0) {
                return false;
            }
        }
        return true;
    }

    static int countPrimes(int n) {
        int count = 0;
        for (int k = 2; k <= n; k++) {
            if (isPrime(k)) {
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(countPrimes(n));
    }
}
''',
    '''import java.util.*;

public class Main {
    public static void main(String[] args) {
        int limit = new Scanner(System.in).nextInt();
        // sieve
        boolean[] composite = new boolean[limit + 1];
        int total = 0;
        for (int p = 2; p <= limit; p++) {
            if (composite[p]) continue;
            total++;
            for (long q = (long) p * p; q <= limit; q += p)
                composite[(int) q] = true;
        }
        System.out.println(total);
    }
}
''',
    '''import java.util.Scanner;

public class Main {
    static boolean primo(int x) {
        if (x <= 1) return false;
        if (x == 2) return true;
        if (x % 2 == 0) return false;
        int r = (int) Math.sqrt(x);
        for (int d = 3; d <= r; d += 2)
            if (x % d == 0) return false;
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int quantos = 0;
        for (int x = 0; x <= n; x++)
            if (primo(x)) quantos++;
        System.out.println(quantos);
    }
}
''',
]

S["fib", "java"] = [
    '''import java.util.Scanner;

public class Main {
    static final long MOD = 1000000007L;

    static long fib(int n) {
        long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            long next = (a + b) % MOD;
            a = b;
            b = next;
        }
        return a;
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(fib(n));
    }
}
''',
    '''import java.util.*;

public class Main {
    static final long M = 1_000_000_007L;

    // 2x2 matrix product
    static long[][] mul(long[][] a, long[][] b) {
        long[][] r = new long[2][2];
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 2; j++)
                r[i][j] = (a[i][0] * b[0][j] + a[i][1] * b[1][j]) % M;
        return r;
    }

    public static void main(String[] args) {
        long e = new Scanner(System.in).nextLong();
        long[][] base = {{1, 1}, {1, 0}}, res = {{1, 0}, {0, 1}};
        while (e > 0) {
            if ((e & 1) == 1) res = mul(res, base);
            base = mul(base, base);
            e >>= 1;
        }
        System.out.println(res[0][1]);
    }
}
''',
    '''import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        int n = entrada.nextInt();
        long[] memo = new long[n + 2];
        memo[1] = 1;
        int i = 2;
        while (i <= n) {
            memo[i] = (memo[i - 1] + memo[i - 2]) % 1000000007;
            i = i + 1;
        }
        System.out.println(memo[n]);
    }
}
''',
]

S["sort", "java"] = [
    '''import java.util.Scanner;

public class Main {
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                    swapped = true;
                }
            }
            if (!swapped) {
                break;
            }
        }
    }

    static void printAll(int[] arr) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) {
                sb.append(' ');
            }
            sb.append(arr[i]);
        }
        System.out.println(sb);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = in.nextInt();
        }
        bubbleSort(arr);
        printAll(arr);
    }
}
''',
    '''import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(sc.nextInt());
        // library sort
        Collections.sort(xs);
        System.out.println(xs.stream().map(String::valueOf).collect(Collectors.joining(" ")));
    }
}
''',
    '''import java.util.Scanner;

public class Main {
    static void ordenar(int[] v) {
        for (int i = 1; i < v.length; i++) {
            int chave = v[i];
            int j = i - 1;
            while (j >= 0 && v[j] > chave) {
                v[j + 1] = v[j];
                j = j - 1;
            }
            v[j + 1] = chave;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] v = new int[n];
        for (int i = 0; i < n; i++)
            v[i] = sc.nextInt();
        ordenar(v);
        for (int i = 0; i < n; i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(v[i]);
        }
        System.out.println();
    }
}
''',
]

PROBLEMS = ["sum_max", "primes", "fib", "sort"]
LANGS = ["python", "c", "java"]
