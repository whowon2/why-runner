#include <iostream>
#include <vector>
#include <unordered_map>

int main() {
    // Read numbers
    std::vector<int> nums;
    int n;
    while (std::cin >> n) {
        nums.push_back(n);
        if (std::cin.peek() == '\n') break;
    }

    // Read target
    int target;
    std::cin >> target;

    // Two Sum Logic
    std::unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            std::cout << map[complement] << " " << i << std::endl;
            return 0;
        }
        map[nums[i]] = i;
    }

    std::cout << "No solution found" << std::endl;
    return 0;
}
