use std::collections::HashMap;
use std::io;

fn main() {
    // Read numbers
    let mut buffer = String::new();
    io::stdin().read_line(&mut buffer).expect("Failed to read line");

    let nums: Vec<i32> = buffer
        .split_whitespace()
        .map(|s| s.parse().expect("Expected a number"))
        .collect();

    // Read target
    let mut target_str = String::new();
    io::stdin().read_line(&mut target_str).expect("Failed to read target");
    let target: i32 = target_str.trim().parse().expect("Expected a target");

    // Two Sum Logic
    let mut map = HashMap::new();
    for (i, num) in nums.iter().enumerate() {
        let complement = target - num;
        if let Some(&index) = map.get(&complement) {
            println!("{} {}", index, i);
            return;
        }
        map.insert(num, i);
    }

    println!("No solution found");
}
