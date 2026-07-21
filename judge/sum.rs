use std::io;
fn main() {
    let mut input = String::new();
    
    // Read the single line from standard input
    if let Ok(_) = io::stdin().read_line(&mut input) {
        // Split the string by whitespace and parse into integers
        let sum: i64 = input
            .trim()
            .split_whitespace()
            .filter_map(|s| s.parse::<i64>().ok())
            .sum();
            
        // Print the result to standard out
        println!("{}", sum);
    }
}