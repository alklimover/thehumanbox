//! Fork: the speed a world really runs at. The requested speed only sets the
//! period and the ticks per period; a big world on a slow (or demoted) core
//! takes longer than the period, so "50x" can really be 3x. The tick loop
//! reports each period (and each pause) here, and `GET /runtime` answers `actual_speed`
//! (apps/web/src/fork/actual-speed.ts shows it beside the requested one).

use std::collections::VecDeque;
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, Instant};

use crate::runtime::RuntimeControl;

/// How much wall time the reading is smoothed over.
const WINDOW: Duration = Duration::from_secs(3);

#[derive(Clone, Copy, PartialEq, Eq)]
struct Config {
    period_ms: u64,
    steps: u32,
}

struct Open {
    started: Instant,
    config: Config,
    /// The first period after a speed change may have run with the old steps.
    counted: bool,
}

#[derive(Default)]
pub(crate) struct SpeedMeter {
    /// Finished periods, oldest first: wall time from one start to the next, and ticks.
    periods: VecDeque<(Duration, u32)>,
    open: Option<Open>,
}

impl SpeedMeter {
    /// One period of the tick loop: it began at `started`, has just finished its
    /// `steps` ticks, and now sleeps out the rest of `period_ms`. Its wall time
    /// runs to the next period's start, so a late wake-up counts as slowness.
    pub(crate) fn record(&mut self, started: Instant, steps: u32, period_ms: u64) {
        let config = Config { period_ms, steps };
        let mut counted = true;
        match self.open.take() {
            Some(prev) if prev.config != config => {
                self.periods.clear();
                counted = false;
            }
            Some(prev) if prev.counted => {
                let wall = started.saturating_duration_since(prev.started);
                self.periods.push_back((wall, prev.config.steps));
            }
            _ => {}
        }
        self.open = Some(Open {
            started,
            config,
            counted,
        });
        let mut total: Duration = self.periods.iter().map(|(wall, _)| *wall).sum();
        while self.periods.len() > 1 && total > WINDOW {
            if let Some((wall, _)) = self.periods.pop_front() {
                total = total.saturating_sub(wall);
            }
        }
    }

    /// Time stopped: it is not slowness, so the reading starts over after it.
    pub(crate) fn pause(&mut self) {
        self.periods.clear();
        self.open = None;
    }

    /// Ticks per second over the window, as a multiple of `base_tick_ms`; None
    /// until a whole period has run at the current speed.
    pub(crate) fn speed(&self, base_tick_ms: u64) -> Option<f64> {
        let wall: Duration = self.periods.iter().map(|(wall, _)| *wall).sum();
        let ticks: u64 = self.periods.iter().map(|(_, steps)| u64::from(*steps)).sum();
        if wall.is_zero() || ticks == 0 {
            return None;
        }
        Some(ticks as f64 * base_tick_ms as f64 / (wall.as_secs_f64() * 1000.0))
    }
}

static METER: LazyLock<Mutex<SpeedMeter>> = LazyLock::new(Mutex::default);

/// Called by the tick loop after each period's ticks.
pub(crate) fn record(started: Instant, steps: u32, period_ms: u64) {
    if let Ok(mut meter) = METER.lock() {
        meter.record(started, steps, period_ms);
    }
}

/// Called by the tick loop while time is stopped.
pub(crate) fn paused() {
    if let Ok(mut meter) = METER.lock() {
        meter.pause();
    }
}

/// The achieved speed for `GET /runtime`, rounded to a hundredth; None while paused.
pub(crate) fn actual_speed(control: &RuntimeControl) -> Option<f64> {
    if control.paused() {
        return None;
    }
    let speed = METER.lock().ok()?.speed(control.base_tick_ms)?;
    Some((speed * 100.0).round() / 100.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ms(n: u64) -> Duration {
        Duration::from_millis(n)
    }

    /// Feeds periods that each take `busy` ms of work and `period` ms of budget.
    fn run(meter: &mut SpeedMeter, at: &mut Instant, count: u32, busy: u64, steps: u32, period: u64) {
        for _ in 0..count {
            meter.record(*at, steps, period);
            *at += ms(busy.max(period));
        }
    }

    #[test]
    fn a_world_that_keeps_up_runs_at_the_requested_speed() {
        let mut meter = SpeedMeter::default();
        let mut at = Instant::now();
        // 50x on a 100 ms base: 8 ticks every 16 ms.
        run(&mut meter, &mut at, 40, 5, 8, 16);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 50.0).abs() < 0.01, "{speed}");
    }

    #[test]
    fn a_world_slower_than_its_period_reports_what_it_achieves() {
        let mut meter = SpeedMeter::default();
        let mut at = Instant::now();
        // Asked for 50x, but 8 ticks take 400 ms: 20 ticks a second, 2x.
        run(&mut meter, &mut at, 20, 400, 8, 16);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 2.0).abs() < 0.01, "{speed}");
    }

    #[test]
    fn nothing_is_known_until_a_period_has_finished() {
        let mut meter = SpeedMeter::default();
        assert_eq!(meter.speed(100), None);
        meter.record(Instant::now(), 1, 100);
        assert_eq!(meter.speed(100), None);
    }

    #[test]
    fn a_speed_change_starts_the_reading_over() {
        let mut meter = SpeedMeter::default();
        let mut at = Instant::now();
        run(&mut meter, &mut at, 30, 5, 1, 100);
        assert!((meter.speed(100).unwrap() - 1.0).abs() < 0.01);
        // The first period at the new speed is not counted, the second closes it.
        run(&mut meter, &mut at, 1, 50, 8, 16);
        assert_eq!(meter.speed(100), None);
        run(&mut meter, &mut at, 2, 50, 8, 16);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 16.0).abs() < 0.01, "{speed}");
    }

    #[test]
    fn a_pause_does_not_count_as_slowness() {
        let mut meter = SpeedMeter::default();
        let mut at = Instant::now();
        run(&mut meter, &mut at, 30, 5, 1, 100);
        meter.pause();
        assert_eq!(meter.speed(100), None);
        at += Duration::from_secs(10);
        run(&mut meter, &mut at, 3, 5, 1, 100);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 1.0).abs() < 0.01, "{speed}");
    }

    #[test]
    fn a_late_wake_up_is_slowness() {
        let mut meter = SpeedMeter::default();
        let mut at = Instant::now();
        run(&mut meter, &mut at, 10, 5, 1, 100);
        // The thread was not scheduled for 400 ms after a period, then ran on.
        at += ms(400);
        run(&mut meter, &mut at, 3, 5, 1, 100);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 12.0 / 16.0).abs() < 0.01, "{speed}");
    }

    #[test]
    fn the_reading_follows_the_last_few_seconds() {
        let mut meter = SpeedMeter::default();
        let mut at = Instant::now();
        // A minute of a fast world, then it grows and slows to 4 ticks a second.
        run(&mut meter, &mut at, 600, 5, 1, 100);
        run(&mut meter, &mut at, 20, 250, 1, 100);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 0.4).abs() < 0.01, "{speed}");
        // One period longer than the whole window still gives a reading.
        run(&mut meter, &mut at, 3, 5_000, 64, 16);
        let speed = meter.speed(100).unwrap();
        assert!((speed - 1.28).abs() < 0.01, "{speed}");
    }
}
