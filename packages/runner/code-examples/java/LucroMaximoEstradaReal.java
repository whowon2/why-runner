import java.util.Scanner;

public class LucroMaximoEstradaReal {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int n = scanner.nextInt();

        int[] lucros = new int[n];
        for (int i = 0; i < n; i++) {
            lucros[i] = scanner.nextInt();
        }

        if (n == 0) {
            System.out.println(0);
            scanner.close();
            return;
        }

        int maxAteAgora = lucros[0];
        int maxAtual = lucros[0];

        for (int i = 1; i < n; i++) {
            maxAtual = Math.max(lucros[i], maxAtual + lucros[i]);

            maxAteAgora = Math.max(maxAteAgora, maxAtual);
        }

        System.out.println(maxAteAgora);

        scanner.close();
    }
}
