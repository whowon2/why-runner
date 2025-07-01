import java.util.*;

public class Code {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Read array of numbers
        String[] tokens = scanner.nextLine().trim().split("\\s+");
        int[] nums = Arrays.stream(tokens).mapToInt(Integer::parseInt).toArray();

        // Read target
        int target = Integer.parseInt(scanner.nextLine().trim());

        // Two Sum Logic
        Map<Integer, Integer> map = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                System.out.println(map.get(complement) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }

        System.out.println("No solution found");
    }
}
