import java.util.Scanner;

public class LucroMaximoEstradaReal {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Lê o número de cidades
        int n = scanner.nextInt();

        // Cria um array para armazenar os lucros/prejuízos
        int[] lucros = new int[n];
        for (int i = 0; i < n; i++) {
            lucros[i] = scanner.nextInt();
        }

        // Se não houver cidades, o lucro é 0 (caso de borda)
        if (n == 0) {
            System.out.println(0);
            scanner.close();
            return;
        }

        // Algoritmo de Kadane
        // 'maxAteAgora' armazena o lucro máximo global encontrado.
        // 'maxAtual' armazena o lucro máximo do trecho que termina na posição atual.
        int maxAteAgora = lucros[0];
        int maxAtual = lucros[0];

        // Começamos do segundo elemento, pois o primeiro já foi inicializado
        for (int i = 1; i < n; i++) {
            // Para cada cidade, decidimos:
            // 1. Continuar o trecho anterior (somando o lucro atual).
            // 2. Começar um novo trecho (usando apenas o lucro da cidade atual).
            // Escolhemos o que for maior.
            maxAtual = Math.max(lucros[i], maxAtual + lucros[i]);

            // Atualizamos o máximo global se o máximo do trecho atual for maior.
            maxAteAgora = Math.max(maxAteAgora, maxAtual);
        }

        System.out.println(maxAteAgora);

        scanner.close();
    }
}
