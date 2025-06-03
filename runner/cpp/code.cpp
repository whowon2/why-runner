#include <iostream>

int main() {
    int a, b;

    std::cin >> a >> b;

    if (a>4) {
        std::cout << 0 << std::endl;
        return 0;
    }

    int sum = a + b;

    std::cout << sum << std::endl;

    return 0;
}
