import java.util.Scanner;
import java.util.Arrays;
import java.util.Comparator;

// Classe para representar cada atração (evento)
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
        Scanner scanner = new Scanner(System.in);

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

        // Passo crucial da abordagem gulosa:
        // Ordenar os eventos pelo horário de término em ordem crescente.
        // Isso nos permite sempre escolher o evento que termina mais cedo,
        // liberando o palco para os próximos eventos o mais rápido possível.
        Arrays.sort(eventos, Comparator.comparingInt(e -> e.fim));

        // O primeiro evento da lista ordenada é sempre escolhido.
        int contadorDeEventos = 1;

        // 'ultimoHorarioDeTermino' guarda o horário que o último evento selecionado terminou.
        int ultimoHorarioDeTermino = eventos[0].fim;

        // Itera a partir do segundo evento
        for (int i = 1; i < n; i++) {
            // Se o evento atual começa DEPOIS ou NO MESMO INSTANTE que o último evento
            // selecionado terminou, então ele não se sobrepõe e pode ser escolhido.
            if (eventos[i].inicio >= ultimoHorarioDeTermino) {
                contadorDeEventos++;
                ultimoHorarioDeTermino = eventos[i].fim; // Atualiza o último horário de término
            }
        }

        System.out.println(contadorDeEventos);

        scanner.close();
    }
}
