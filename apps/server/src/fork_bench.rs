//! Fork: `simulation-rs --bench-cpu`, a short fixed workload the desktop app
//! runs once to learn how fast this machine steps a world. The app scales its
//! measured cost curve by the ratio to the reference machine to colour the
//! world-capacity slider (apps/desktop/main/fork-device.ts,
//! apps/web/src/fork/population-load.ts).

use crate::sim::simulation::Simulation;

/// The workload: a fixed seed, warmed up, then timed. Early-world ticks cost
/// ~2 ms on an M5 Pro core, so the timed part takes about two seconds there.
pub(crate) const BENCH_SEED: u64 = 0xBE_4C11;
const WARMUP_TICKS: u32 = 100;
const TIMED_TICKS: u32 = 1000;

pub(crate) fn requested(args: &[String]) -> bool {
    args.iter().skip(1).any(|arg| arg == "--bench-cpu")
}

/// Runs the workload and prints one JSON line: `{"bench":1,"ms_per_tick":…}`.
pub(crate) fn run() {
    let mut sim = Simulation::new(BENCH_SEED);
    for _ in 0..WARMUP_TICKS {
        sim.tick();
    }
    let started = std::time::Instant::now();
    for _ in 0..TIMED_TICKS {
        sim.tick();
    }
    let ms_per_tick = started.elapsed().as_secs_f64() * 1000.0 / f64::from(TIMED_TICKS);
    println!(
        "{}",
        serde_json::json!({
            "bench": 1,
            "seed": BENCH_SEED,
            "ticks": TIMED_TICKS,
            "ms_per_tick": ms_per_tick,
            "alive": sim.organisms.iter().filter(|o| o.alive).count(),
        })
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_flag_requests_the_bench() {
        let args = |list: &[&str]| list.iter().map(|s| s.to_string()).collect::<Vec<_>>();
        assert!(requested(&args(&["simulation-rs", "--bench-cpu"])));
        assert!(!requested(&args(&["simulation-rs"])));
        // The program name is not an argument.
        assert!(!requested(&args(&["--bench-cpu"])));
    }
}
