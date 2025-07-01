fn main() {
    let mut buffer = String::new();
    std::io::stdin()
        .read_line(&mut buffer)
        .expect("Failed to read line");

    let nums: Vec<u32> = buffer
        .split_whitespace()
        .map(|s| s.parse::<u32>().expect("Expected a number"))
        .collect();

    let sum = nums[0] + nums[1];

    println!("{}", sum);
}
