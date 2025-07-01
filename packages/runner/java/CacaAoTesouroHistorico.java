import java.util.Scanner;

public class CacaAoTesouroHistorico {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Lê a primeira linha: N (número de igrejas) e X (número mágico)
        int n = scanner.nextInt();
        int x = scanner.nextInt();

        // Inicializa o contador de igrejas que correspondem ao critério
        int contadorDeIgrejas = 0;

        // Itera N vezes para ler a quantidade de ouro de cada igreja
        for (int i = 0; i < n; i++) {
            int barrasDeOuro = scanner.nextInt();

            // Se a quantidade de barras for igual ao número mágico, incrementa o contador
            if (barrasDeOuro == x) {
                contadorDeIgrejas++;
            }
        }

        // Imprime o resultado final
        System.out.println(contadorDeIgrejas);

        scanner.close();
    }
}
