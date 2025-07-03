import java.util.Scanner;
import java.util.Arrays;
import java.util.Comparator;

class Evento {
    int inicio;
    int fim;

    public Evento(int inicio, int fim) {
        this.inicio = inicio;
        this.fim = fim;
    }
}

public class FestivalDeInverno {

    public static void main(String[] args) {

        int n = scanner.nextInt();
        Evento[] eventos = new Evento[n];

        for (int i = 0; i < n; i++) {
            int inicio = scanner.nextInt();
            int fim = scanner.nextInt();
            eventos[i] = new Evento(inicio, fim);
        }

        if (n == 0) {
            System.out.println(0);
            scanner.close();
            return;
        }

        Arrays.sort(eventos, Comparator.comparingInt(e -> e.fim));

        int contadorDeEventos = 1;

        int ultimoHorarioDeTermino = eventos[0].fim;

        for (int i = 1; i < n; i++) {
            if (eventos[i].inicio >= ultimoHorarioDeTermino) {
                contadorDeEventos++;
                ultimoHorarioDeTermino = eventos[i].fim;
            }
        }

        System.out.println(contadorDeEventos);

        scanner.close();
    }
}
