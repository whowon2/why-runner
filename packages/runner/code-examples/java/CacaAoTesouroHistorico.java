import java.util.Scanner;

public class CacaAoTesouroHistorico {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int n = scanner.nextInt();
        int x = scanner.nextInt();

        int contadorDeIgrejas = 0;

        for (int i = 0; i < n; i++) {
            int barrasDeOuro = scanner.nextInt();

            if (barrasDeOuro == x) {
                contadorDeIgrejas++;
            }
        }

        System.out.println(contadorDeIgrejas);

        scanner.close();
    }
}
