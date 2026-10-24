//! Bounded local detours. Ordinary open-ground steps keep the cheap steering
//! path; this search only runs when a direct step is blocked.
use std::cell::RefCell;
use std::cmp::Reverse;
use std::collections::BinaryHeap;

use super::organism::DIRECTIONS;
use crate::world::{grid::WorldGrid, tiles::Tile};

/// Frontier entries as one integer whose numeric order is the order of the
/// tuple `(estimate, cost, x, y, first)` they stand for: every field sits in its
/// own bit range, most significant first. `first` is the first direction taken
/// (`usize::MAX` for none) and is only ever compared last. `None` when a value
/// falls outside its range (nothing in a real world does), in which case the
/// caller falls back to the plain tuple search in `wide`.
fn pack(estimate: i32, cost: i32, x: i32, y: i32, first: usize) -> Option<u64> {
    let first = if first == usize::MAX { 15 } else { first as u64 };
    if !(0..1 << 21).contains(&estimate)
        || !(0..1 << 20).contains(&cost)
        || !(0..1 << 10).contains(&x)
        || !(0..1 << 9).contains(&y)
        || first > 15
    {
        return None;
    }
    Some(((estimate as u64) << 43) | ((cost as u64) << 23) | ((x as u64) << 13) | ((y as u64) << 4) | first)
}

/// (cost, x, y, first) of a packed frontier entry.
fn unpack(key: u64) -> (i32, i32, i32, usize) {
    let first = (key & 0xf) as usize;
    (
        ((key >> 23) & 0xf_ffff) as i32,
        ((key >> 13) & 0x3ff) as i32,
        ((key >> 4) & 0x1ff) as i32,
        if first == 15 { usize::MAX } else { first },
    )
}

/// Search state that outlives a call: a search touches a few hundred of the
/// window's cells, so instead of clearing (and allocating) the whole window each
/// time, a cell counts only when its stamp matches the current search.
struct Scratch {
    stamp: Vec<u32>,
    cost: Vec<i32>,
    parent: Vec<u32>,
    generation: u32,
    frontier: BinaryHeap<Reverse<u64>>,
}

impl Scratch {
    fn new(cells: usize) -> Self {
        Self {
            stamp: vec![0; cells],
            cost: vec![0; cells],
            parent: vec![0; cells],
            generation: 0,
            frontier: BinaryHeap::new(),
        }
    }

    fn begin(&mut self) {
        self.generation = self.generation.wrapping_add(1);
        if self.generation == 0 {
            self.stamp.fill(0);
            self.generation = 1;
        }
        self.frontier.clear();
    }

    fn cost(&self, cell: usize) -> i32 {
        if self.stamp[cell] == self.generation {
            self.cost[cell]
        } else {
            i32::MAX
        }
    }

    fn set_cost(&mut self, cell: usize, cost: i32) {
        self.stamp[cell] = self.generation;
        self.cost[cell] = cost;
    }
}

thread_local! {
    static DETOUR: RefCell<Scratch> = RefCell::new(Scratch::new(DETOUR_SIDE * DETOUR_SIDE));
    static PLAN: RefCell<Planner> = RefCell::new(Planner::new());
}

/// What a step onto open ground costs in a route search. A road costs less (people walk the roads
/// they can reach rather than cut across them), and hazard adds on top.
const OPEN_STEP_COST: i32 = 10;
const ROAD_STEP_COST: i32 = 6;

fn step_cost(grid: &WorldGrid, x: i32, y: i32) -> i32 {
    let base = if grid.is_road(x, y) {
        ROAD_STEP_COST
    } else {
        OPEN_STEP_COST
    };
    base + (grid.hazard_at(x, y) * 30.0) as i32
}

const DETOUR_RADIUS: i32 = 16;
const DETOUR_SIDE: usize = (DETOUR_RADIUS * 2 + 1) as usize;

pub(crate) fn detour_step(grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> Option<usize> {
    DETOUR
        .with(|scratch| detour_step_in(&mut scratch.borrow_mut(), grid, start, target))
        .unwrap_or_else(|| wide::detour_step(grid, start, target))
}

/// `None` when a frontier entry would not pack; otherwise the answer.
fn detour_step_in(
    scratch: &mut Scratch,
    grid: &WorldGrid,
    start: (i32, i32),
    target: (i32, i32),
) -> Option<Option<usize>> {
    const BUDGET: usize = 128;
    let index = |x: i32, y: i32| {
        ((y - start.1 + DETOUR_RADIUS) as usize) * DETOUR_SIDE + (x - start.0 + DETOUR_RADIUS) as usize
    };
    let distance = |x: i32, y: i32| (target.0 - x).abs().max((target.1 - y).abs());
    scratch.begin();
    scratch.set_cost(index(start.0, start.1), 0);
    scratch.frontier.push(Reverse(pack(
        distance(start.0, start.1) * 10,
        0,
        start.0,
        start.1,
        usize::MAX,
    )?));
    let mut best = None;
    let mut best_distance = distance(start.0, start.1);
    let target_water = grid.get(target.0, target.1) == Tile::Water;
    for _ in 0..BUDGET {
        let Some(Reverse(key)) = scratch.frontier.pop() else {
            break;
        };
        let (cost, x, y, first) = unpack(key);
        if cost != scratch.cost(index(x, y)) {
            continue;
        }
        let remaining = distance(x, y);
        if remaining < best_distance && first != usize::MAX {
            best_distance = remaining;
            best = Some(first);
        }
        // A useful waypoint is enough for a local detour. Do not search
        // the whole window for a destination hundreds of tiles away.
        if remaining == 0 || remaining + 4 <= distance(start.0, start.1) {
            return Some(best);
        }
        for (direction, &(dx, dy)) in DIRECTIONS.iter().enumerate() {
            let (nx, ny) = (x + dx, y + dy);
            if (nx - start.0).abs() > DETOUR_RADIUS || (ny - start.1).abs() > DETOUR_RADIUS {
                continue;
            }
            let tile = grid.get(nx, ny);
            if !tile.walkable() || tile == Tile::Fire {
                continue;
            }
            // Seeking water permits entering the requested water tile only,
            // not taking a shortcut across a lake on the way to it.
            if grid.is_wet(tile, nx, ny)
                && grid.depth_at(nx, ny) > 0.18
                && !(target_water && (nx, ny) == target)
            {
                continue;
            }
            let next_cost = cost + step_cost(grid, nx, ny);
            let idx = index(nx, ny);
            if next_cost >= scratch.cost(idx) {
                continue;
            }
            scratch.set_cost(idx, next_cost);
            let first = if first == usize::MAX { direction } else { first };
            scratch.frontier.push(Reverse(pack(
                next_cost + distance(nx, ny) * 10,
                next_cost,
                nx,
                ny,
                first,
            )?));
        }
    }
    Some(best)
}

/// Window around the walker that a full route plan may search.
const PLAN_RADIUS: i32 = 40;
/// Most tiles one plan may expand; bounded so a crowd of blocked walkers
/// cannot stall a tick.
const PLAN_SIDE: usize = (PLAN_RADIUS * 2 + 1) as usize;
/// Most tiles one plan may expand; bounded so a crowd of blocked walkers
/// cannot stall a tick.
const PLAN_BUDGET: usize = 3000;
/// The route search's estimate per tile of distance to the target: a weighted A* (1.4 times the open-ground
/// step). The admissible estimate (the road step, 6) was measured slower: 4 to 12% more instructions, because
/// it weakens the pull toward the goal across open ground. At 10 (the open step) the estimate overshoots along
/// roads, so the search expands toward its node budget. At 14 the search does fewer expansions (4 to 5% fewer
/// instructions over 3000 ticks) and the 8-seed mean alive at tick 9000 rose from 138.9 to 142.5.
const ESTIMATE_PER_TILE: i32 = 14;

/// A remembered route toward a goal, followed one waypoint per step so the
/// next tick cannot undo the last one (the cause of people pacing between
/// two tiles in front of a mountain).
#[derive(Default, Clone, Debug)]
pub struct RouteCache {
    pub goal: (i32, i32),
    pub steps: Vec<(i32, i32)>,
    pub next: usize,
    /// The last goal a plan found no way toward, for the sim to act on.
    pub unreachable: Option<(i32, i32)>,
    /// A goal that recently failed to plan, and how many more requests to
    /// skip replanning it (so a walled-in goal costs one search, not one
    /// per tick).
    pub blocked: Option<(i32, i32)>,
    pub blocked_for: u16,
    /// The tile this walker last made a route decision from, and the tile it came from before that.
    /// A greedy step straight back onto the latter is a reversal: the walker is stuck between two tiles.
    pub here: Option<(i32, i32)>,
    pub before: Option<(i32, i32)>,
    /// Steps in a row straight back onto the tile before.
    pub reversals: u8,
}

fn near(a: (i32, i32), b: (i32, i32)) -> bool {
    (a.0 - b.0).abs().max((a.1 - b.1).abs()) <= 3
}

impl RouteCache {
    /// True while `goal` is a recently failed one.
    pub fn recently_blocked(&self, goal: (i32, i32)) -> bool {
        self.blocked_for > 0 && self.blocked.is_some_and(|b| near(b, goal))
    }

    /// True when a recently failed goal should not be replanned.
    pub fn skip_blocked(&mut self, goal: (i32, i32)) -> bool {
        self.recently_blocked(goal)
    }

    /// Run down the memory of a failed goal, once per decision.
    pub fn decay_blocked(&mut self) {
        self.blocked_for = self.blocked_for.saturating_sub(1);
    }

    pub fn mark_blocked(&mut self, goal: (i32, i32)) {
        self.steps.clear();
        self.unreachable = Some(goal);
        self.blocked = Some(goal);
        self.blocked_for = 60;
    }

    /// Direction of the next waypoint when this cached route still serves
    /// `goal` from `at`.
    pub fn follow(&mut self, grid: &WorldGrid, at: (i32, i32), goal: (i32, i32)) -> Option<usize> {
        if self.steps.is_empty() || (self.goal.0 - goal.0).abs().max((self.goal.1 - goal.1).abs()) > 3 {
            return None;
        }
        // Skip waypoints already reached (or overtaken by a sidestep).
        if let Some(k) = self.steps[self.next..].iter().take(4).position(|&p| p == at) {
            self.next += k + 1;
        }
        let Some(&(wx, wy)) = self.steps.get(self.next) else {
            self.steps.clear();
            return None;
        };
        let (dx, dy) = (wx - at.0, wy - at.1);
        let tile = grid.get(wx, wy);
        if dx.abs().max(dy.abs()) != 1 || !tile.walkable() || tile == Tile::Fire {
            self.steps.clear();
            return None;
        }
        DIRECTIONS.iter().position(|&d| d == (dx, dy))
    }
}

/// Plan a route from `start` toward `target` with A* inside a window
/// around the walker. Returns the steps to the target, or to the reachable
/// tile nearest it, or `None` when no tile gets meaningfully closer.
pub(crate) fn plan_route(grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> Option<Vec<(i32, i32)>> {
    let route = PLAN
        .with(|planner| planner.borrow_mut().plan(grid, start, target))
        .unwrap_or_else(|| wide::plan_route(grid, start, target));
    #[cfg(test)]
    assert_eq!(
        route,
        wide::plan_route(grid, start, target),
        "route {start:?} -> {target:?}"
    );
    route
}

/// What a route search learns from a tile next to one it expands: `None` when the walker may not step
/// there, otherwise what the step costs. The search reads nothing else from the map: whether the target
/// is water matters only on the target tile, and so only through what this returns there.
fn plan_step(grid: &WorldGrid, x: i32, y: i32, target: (i32, i32), target_water: bool) -> Option<i32> {
    let tile = grid.get(x, y);
    if !tile.walkable() || tile == Tile::Fire {
        return None;
    }
    if grid.is_wet(tile, x, y) && grid.depth_at(x, y) > 0.18 && !(target_water && (x, y) == target) {
        return None;
    }
    Some(step_cost(grid, x, y))
}

/// `plan_step` of a tile as one byte: 0 for no step, otherwise the cost. `None` for a cost that does not
/// fit (none does in a real world: hazard is at most 1, so a step costs at most 40).
fn step_code(step: Option<i32>) -> Option<u8> {
    match step {
        None => Some(0),
        Some(cost) => u8::try_from(cost).ok().filter(|&code| code != 0),
    }
}

/// What `plan_route` answers.
type Route = Option<Vec<(i32, i32)>>;

/// Remembered searches by (start, target). Never walked, so its order does not matter.
type RememberedMap = std::collections::HashMap<
    ((i32, i32), (i32, i32)),
    Remembered,
    std::hash::BuildHasherDefault<crate::hashing::FxHasher>,
>;

/// Words of a bit set with one bit per tile of the plan window.
const PLAN_WORDS: usize = (PLAN_SIDE * PLAN_SIDE).div_ceil(64);
/// A search that expanded fewer tiles than this is cheaper to run again than to remember.
const REMEMBER_EXPANDED: usize = 64;
/// Most memory the remembered searches may take, in bytes. Half of it holds the searches since the last
/// turnover and half the ones before; on a 2,600-person world that keeps a search for 30 to 60 ticks.
/// At 4,260 people half as much cost 0.4% more instructions a tick and twice as much saved 0.1%.
const REMEMBER_BYTES: usize = 16 << 20;

/// A finished search: every tile it read with what it read there, and its answer.
struct Remembered {
    /// The bit set of tiles read, from word `first_word` of the window on (the words before are empty).
    first_word: usize,
    read: Box<[u64]>,
    /// `step_code` of each tile read, in the order of the bit set.
    codes: Box<[u8]>,
    route: Route,
}

impl Remembered {
    fn bytes(&self) -> usize {
        std::mem::size_of::<Self>()
            + self.read.len() * 8
            + self.codes.len()
            + self.route.as_ref().map_or(0, |steps| steps.len() * 8)
    }

    /// True when every tile the search read still reads the same. The search depends on nothing else
    /// (its start and target are the key), so it would run again step for step to the same answer.
    fn still_holds(&self, grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> bool {
        let target_water = grid.get(target.0, target.1) == Tile::Water;
        let mut codes = self.codes.iter();
        for (offset, &word) in self.read.iter().enumerate() {
            let mut bits = word;
            while bits != 0 {
                let cell = (self.first_word + offset) * 64 + bits.trailing_zeros() as usize;
                bits &= bits - 1;
                let x = (cell % PLAN_SIDE) as i32 + start.0 - PLAN_RADIUS;
                let y = (cell / PLAN_SIDE) as i32 + start.1 - PLAN_RADIUS;
                let Some(&code) = codes.next() else {
                    return false;
                };
                if step_code(plan_step(grid, x, y, target, target_water)) != Some(code) {
                    return false;
                }
            }
        }
        true
    }
}

/// The route search's state between calls: its scratch, the tiles the current search has read, and the
/// searches worth remembering. People ask for the same route from the same tile many times: a walker
/// standing on a tile for a few ticks asks for its wander target and for its chosen goal in turn, and
/// each answer replaces the other in its `RouteCache`. On a 2,600-person world half the tiles the search
/// expanded were such repeats. A remembered answer is given only after checking that every tile its
/// search read still reads the same, so it is always the answer a new search would give.
struct Planner {
    scratch: Scratch,
    /// Tiles the current search has read, and `plan_step` of each (`BLOCKED` for none).
    read: Vec<u64>,
    step: Vec<i32>,
    remembered: RememberedMap,
    older: RememberedMap,
    remembered_bytes: usize,
    /// Bytes of one generation of remembered searches: `REMEMBER_BYTES / 2`.
    generation_bytes: usize,
    /// Answers given from memory, and remembered searches that no longer held.
    #[cfg(test)]
    reused: u64,
    #[cfg(test)]
    outdated: u64,
}

/// `Planner::step` of a tile the walker may not enter. No step costs this: a cost is a base of 6 or 10
/// plus the hazard's share, and that share is at least `i32::MIN`.
const BLOCKED: i32 = i32::MIN;

impl Planner {
    fn new() -> Self {
        Self {
            scratch: Scratch::new(PLAN_SIDE * PLAN_SIDE),
            read: vec![0; PLAN_WORDS],
            step: vec![0; PLAN_SIDE * PLAN_SIDE],
            remembered: RememberedMap::default(),
            older: RememberedMap::default(),
            remembered_bytes: 0,
            generation_bytes: REMEMBER_BYTES / 2,
            #[cfg(test)]
            reused: 0,
            #[cfg(test)]
            outdated: 0,
        }
    }

    /// `None` when a frontier entry would not pack; otherwise the answer.
    fn plan(&mut self, grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> Option<Route> {
        let key = (start, target);
        #[cfg(test)]
        let had = self.remembered.contains_key(&key) || self.older.contains_key(&key);
        let holds = match self.remembered.get(&key) {
            Some(known) => known.still_holds(grid, start, target),
            None => self.older.remove(&key).is_some_and(|known| {
                let holds = known.still_holds(grid, start, target);
                if holds {
                    self.keep(key, known);
                }
                holds
            }),
        };
        if holds {
            #[cfg(test)]
            {
                self.reused += 1;
            }
            return Some(self.remembered[&key].route.clone());
        }
        if let Some(stale) = self.remembered.remove(&key) {
            self.remembered_bytes -= stale.bytes();
        }
        #[cfg(test)]
        {
            self.outdated += u64::from(had);
        }
        let (route, expanded) = self.search(grid, start, target)?;
        if expanded >= REMEMBER_EXPANDED {
            if let Some(known) = self.remember(&route) {
                self.keep(key, known);
            }
        }
        Some(route)
    }

    /// The finished search as a `Remembered`, or `None` when a step cost does not fit a code.
    fn remember(&self, route: &Route) -> Option<Remembered> {
        let first_word = self.read.iter().position(|&word| word != 0)?;
        let last_word = self.read.iter().rposition(|&word| word != 0)?;
        let read: Box<[u64]> = self.read[first_word..=last_word].into();
        let mut codes = Vec::with_capacity(read.iter().map(|word| word.count_ones() as usize).sum());
        for (offset, &word) in read.iter().enumerate() {
            let mut bits = word;
            while bits != 0 {
                let cell = (first_word + offset) * 64 + bits.trailing_zeros() as usize;
                bits &= bits - 1;
                let step = self.step[cell];
                codes.push(step_code((step != BLOCKED).then_some(step))?);
            }
        }
        Some(Remembered {
            first_word,
            read,
            codes: codes.into(),
            route: route.clone(),
        })
    }

    fn keep(&mut self, key: ((i32, i32), (i32, i32)), known: Remembered) {
        let bytes = known.bytes();
        if self.remembered_bytes + bytes > self.generation_bytes {
            self.older = std::mem::take(&mut self.remembered);
            self.remembered_bytes = 0;
        }
        self.remembered_bytes += bytes;
        self.remembered.insert(key, known);
    }

    /// The A* search. `None` when a frontier entry would not pack; otherwise the answer and how many
    /// tiles it expanded.
    fn search(&mut self, grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> Option<(Route, usize)> {
        const SIDE: usize = PLAN_SIDE;
        let inside =
            |x: i32, y: i32| (x - start.0).abs() <= PLAN_RADIUS && (y - start.1).abs() <= PLAN_RADIUS;
        let index = |x: i32, y: i32| {
            ((y - start.1 + PLAN_RADIUS) as usize) * SIDE + (x - start.0 + PLAN_RADIUS) as usize
        };
        let distance = |x: i32, y: i32| (target.0 - x).abs().max((target.1 - y).abs());
        let target_water = grid.get(target.0, target.1) == Tile::Water;
        let Self {
            scratch, read, step, ..
        } = self;
        read.fill(0);
        scratch.begin();
        scratch.set_cost(index(start.0, start.1), 0);
        scratch.frontier.push(Reverse(pack(
            distance(start.0, start.1) * ESTIMATE_PER_TILE,
            0,
            start.0,
            start.1,
            usize::MAX,
        )?));
        let start_distance = distance(start.0, start.1);
        let mut best = (start_distance, 0, start);
        let mut expanded = 0;
        while let Some(Reverse(key)) = scratch.frontier.pop() {
            let (cost, x, y, _) = unpack(key);
            if cost != scratch.cost(index(x, y)) {
                continue;
            }
            let remaining = distance(x, y);
            if (remaining, cost) < (best.0, best.1) {
                best = (remaining, cost, (x, y));
            }
            expanded += 1;
            if remaining == 0 || expanded >= PLAN_BUDGET {
                break;
            }
            for &(dx, dy) in DIRECTIONS.iter() {
                let (nx, ny) = (x + dx, y + dy);
                if !inside(nx, ny) || !WorldGrid::in_bounds(nx, ny) {
                    continue;
                }
                let idx = index(nx, ny);
                // A tile is a neighbour of up to eight expanded ones: read it once.
                let (word, bit) = (idx / 64, 1u64 << (idx % 64));
                let cell_step = if read[word] & bit != 0 {
                    step[idx]
                } else {
                    read[word] |= bit;
                    step[idx] = plan_step(grid, nx, ny, target, target_water).unwrap_or(BLOCKED);
                    step[idx]
                };
                if cell_step == BLOCKED {
                    continue;
                }
                let next_cost = cost + cell_step;
                if next_cost >= scratch.cost(idx) {
                    continue;
                }
                scratch.set_cost(idx, next_cost);
                scratch.parent[idx] = index(x, y) as u32;
                scratch.frontier.push(Reverse(pack(
                    next_cost + distance(nx, ny) * ESTIMATE_PER_TILE,
                    next_cost,
                    nx,
                    ny,
                    usize::MAX,
                )?));
            }
        }
        // Only worth walking when it ends clearly closer than we started.
        if best.2 == start || best.0 + 2 > start_distance && best.0 != 0 {
            return Some((None, expanded));
        }
        let mut steps = Vec::new();
        let mut at = index(best.2 .0, best.2 .1);
        let origin = index(start.0, start.1);
        while at != origin {
            let (x, y) = ((at % SIDE) as i32, (at / SIDE) as i32);
            steps.push((x + start.0 - PLAN_RADIUS, y + start.1 - PLAN_RADIUS));
            at = scratch.parent[at] as usize;
        }
        steps.reverse();
        Some((Some(steps), expanded))
    }
}

/// The plain searches: fresh arrays and a tuple heap per call, no limits on the
/// values they handle. The fast versions above answer the same; these take over
/// if one of their packed values would not fit, and test builds check every
/// planned route against `wide::plan_route`.
mod wide {
    use super::*;

    pub(super) fn detour_step(grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> Option<usize> {
        const RADIUS: i32 = 16;
        const SIDE: usize = (RADIUS * 2 + 1) as usize;
        const BUDGET: usize = 128;
        let index =
            |x: i32, y: i32| ((y - start.1 + RADIUS) as usize) * SIDE + (x - start.0 + RADIUS) as usize;
        let distance = |x: i32, y: i32| (target.0 - x).abs().max((target.1 - y).abs());
        let mut costs = [i32::MAX; SIDE * SIDE];
        let mut frontier = BinaryHeap::new();
        costs[index(start.0, start.1)] = 0;
        frontier.push(Reverse((
            distance(start.0, start.1) * 10,
            0,
            start.0,
            start.1,
            usize::MAX,
        )));
        let mut best = None;
        let mut best_distance = distance(start.0, start.1);
        let target_water = grid.get(target.0, target.1) == Tile::Water;
        for _ in 0..BUDGET {
            let Some(Reverse((_, cost, x, y, first))) = frontier.pop() else {
                break;
            };
            if cost != costs[index(x, y)] {
                continue;
            }
            let remaining = distance(x, y);
            if remaining < best_distance && first != usize::MAX {
                best_distance = remaining;
                best = Some(first);
            }
            // A useful waypoint is enough for a local detour. Do not search
            // the whole window for a destination hundreds of tiles away.
            if remaining == 0 || remaining + 4 <= distance(start.0, start.1) {
                return best;
            }
            for (direction, &(dx, dy)) in DIRECTIONS.iter().enumerate() {
                let (nx, ny) = (x + dx, y + dy);
                if (nx - start.0).abs() > RADIUS || (ny - start.1).abs() > RADIUS {
                    continue;
                }
                let tile = grid.get(nx, ny);
                if !tile.walkable() || tile == Tile::Fire {
                    continue;
                }
                // Seeking water permits entering the requested water tile only,
                // not taking a shortcut across a lake on the way to it.
                if grid.is_wet(tile, nx, ny)
                    && grid.depth_at(nx, ny) > 0.18
                    && !(target_water && (nx, ny) == target)
                {
                    continue;
                }
                let next_cost = cost + step_cost(grid, nx, ny);
                let idx = index(nx, ny);
                if next_cost >= costs[idx] {
                    continue;
                }
                costs[idx] = next_cost;
                let first = if first == usize::MAX { direction } else { first };
                frontier.push(Reverse((
                    next_cost + distance(nx, ny) * 10,
                    next_cost,
                    nx,
                    ny,
                    first,
                )));
            }
        }
        best
    }

    /// Plan a route from `start` toward `target` with A* inside a window
    /// around the walker. Returns the steps to the target, or to the reachable
    /// tile nearest it, or `None` when no tile gets meaningfully closer.
    pub(super) fn plan_route(
        grid: &WorldGrid,
        start: (i32, i32),
        target: (i32, i32),
    ) -> Option<Vec<(i32, i32)>> {
        const SIDE: usize = (PLAN_RADIUS * 2 + 1) as usize;
        let inside =
            |x: i32, y: i32| (x - start.0).abs() <= PLAN_RADIUS && (y - start.1).abs() <= PLAN_RADIUS;
        let index = |x: i32, y: i32| {
            ((y - start.1 + PLAN_RADIUS) as usize) * SIDE + (x - start.0 + PLAN_RADIUS) as usize
        };
        let distance = |x: i32, y: i32| (target.0 - x).abs().max((target.1 - y).abs());
        let target_water = grid.get(target.0, target.1) == Tile::Water;
        let mut costs = vec![i32::MAX; SIDE * SIDE];
        let mut parent = vec![u32::MAX; SIDE * SIDE];
        let mut frontier = BinaryHeap::new();
        costs[index(start.0, start.1)] = 0;
        frontier.push(Reverse((
            distance(start.0, start.1) * ESTIMATE_PER_TILE,
            0,
            start.0,
            start.1,
        )));
        let start_distance = distance(start.0, start.1);
        let mut best = (start_distance, 0, start);
        let mut expanded = 0;
        while let Some(Reverse((_, cost, x, y))) = frontier.pop() {
            if cost != costs[index(x, y)] {
                continue;
            }
            let remaining = distance(x, y);
            if (remaining, cost) < (best.0, best.1) {
                best = (remaining, cost, (x, y));
            }
            expanded += 1;
            if remaining == 0 || expanded >= PLAN_BUDGET {
                break;
            }
            for &(dx, dy) in DIRECTIONS.iter() {
                let (nx, ny) = (x + dx, y + dy);
                if !inside(nx, ny) || !WorldGrid::in_bounds(nx, ny) {
                    continue;
                }
                let tile = grid.get(nx, ny);
                if !tile.walkable() || tile == Tile::Fire {
                    continue;
                }
                if grid.is_wet(tile, nx, ny)
                    && grid.depth_at(nx, ny) > 0.18
                    && !(target_water && (nx, ny) == target)
                {
                    continue;
                }
                let next_cost = cost + step_cost(grid, nx, ny);
                let idx = index(nx, ny);
                if next_cost >= costs[idx] {
                    continue;
                }
                costs[idx] = next_cost;
                parent[idx] = index(x, y) as u32;
                frontier.push(Reverse((
                    next_cost + distance(nx, ny) * ESTIMATE_PER_TILE,
                    next_cost,
                    nx,
                    ny,
                )));
            }
        }
        // Only worth walking when it ends clearly closer than we started.
        if best.2 == start || best.0 + 2 > start_distance && best.0 != 0 {
            return None;
        }
        let mut steps = Vec::new();
        let mut at = index(best.2 .0, best.2 .1);
        let origin = index(start.0, start.1);
        while at != origin {
            let (x, y) = ((at % SIDE) as i32, (at / SIDE) as i32);
            steps.push((x + start.0 - PLAN_RADIUS, y + start.1 - PLAN_RADIUS));
            at = parent[at] as usize;
        }
        steps.reverse();
        Some(steps)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn walled() -> WorldGrid {
        let mut grid = WorldGrid::new(1);
        for y in 60..140 {
            for x in 60..140 {
                grid.set(x, y, Tile::Grass);
            }
        }
        // A cup-shaped ridge opening west: walking east from inside the cup
        // means going back out and around it.
        for y in 90..=110 {
            grid.set(105, y, Tile::Rock);
        }
        for x in 95..=105 {
            grid.set(x, 90, Tile::Rock);
            grid.set(x, 110, Tile::Rock);
        }
        grid
    }

    /// A block of rock between the walker and the target, open rows above and below it. Either way round
    /// is the same length on open ground.
    fn blocked_middle() -> WorldGrid {
        let mut grid = WorldGrid::new(1);
        for y in 60..140 {
            for x in 60..140 {
                grid.set(x, y, Tile::Grass);
            }
        }
        for y in 99..=101 {
            for x in 95..=105 {
                grid.set(x, y, Tile::Rock);
            }
        }
        grid
    }

    #[test]
    fn a_road_round_the_block_is_taken_over_open_ground() {
        let mut grid = blocked_middle();
        // The walk along the row below the block is a road, from the walker's side to the target's.
        for x in 92..=108 {
            grid.road[WorldGrid::idx(x, 102)] = crate::world::grid::ROAD_TRACK;
        }
        grid.road[WorldGrid::idx(91, 101)] = crate::world::grid::ROAD_TRACK;
        grid.road[WorldGrid::idx(109, 101)] = crate::world::grid::ROAD_TRACK;
        let steps = plan_route(&grid, (90, 100), (110, 100)).expect("a route");
        assert_eq!(steps.last(), Some(&(110, 100)));
        assert!(
            steps
                .iter()
                .filter(|&&(x, y)| y == 102 && (92..=108).contains(&x))
                .count()
                > 10,
            "the route runs along the road below the block: {steps:?}"
        );
    }

    /// A deep river down column 100, from end to end of the open region, with a bridge at (100, 100) when asked.
    fn river(bridge: bool) -> WorldGrid {
        let mut grid = WorldGrid::new(1);
        for y in 60..140 {
            for x in 60..140 {
                grid.set(x, y, Tile::Grass);
            }
        }
        for y in 60..140 {
            grid.set(100, y, Tile::Water);
            grid.depth[WorldGrid::idx(100, y)] = 0.5;
        }
        if bridge {
            grid.road[WorldGrid::idx(100, 100)] = crate::world::grid::ROAD_BRIDGE;
        }
        grid
    }

    #[test]
    fn a_river_is_crossed_only_by_the_bridge() {
        let without = plan_route(&river(false), (90, 100), (110, 100));
        assert!(
            without.is_none_or(|steps| steps.iter().all(|&(x, _)| x < 100)),
            "no way over the deep river without a bridge"
        );
        let with = plan_route(&river(true), (90, 100), (110, 100)).expect("a route over the bridge");
        assert_eq!(with.last(), Some(&(110, 100)));
        assert!(with.contains(&(100, 100)), "the route goes over the bridge");
    }

    #[test]
    fn a_route_leads_out_of_a_cup_and_around_the_ridge() {
        let grid = walled();
        let steps = plan_route(&grid, (100, 100), (125, 100)).expect("a route");
        let &(ex, ey) = steps.last().unwrap();
        assert_eq!((ex, ey), (125, 100));
        for w in std::iter::once(&(100, 100))
            .chain(steps.iter())
            .collect::<Vec<_>>()
            .windows(2)
        {
            assert_eq!((w[0].0 - w[1].0).abs().max((w[0].1 - w[1].1).abs()), 1);
            assert!(grid.get(w[1].0, w[1].1).walkable());
        }
    }

    #[test]
    fn a_walled_in_goal_leads_to_the_nearest_tile_outside_its_wall() {
        let mut grid = walled();
        for y in 118..=132 {
            for x in 118..=132 {
                if y == 118 || y == 132 || x == 118 || x == 132 {
                    grid.set(x, y, Tile::Rock);
                }
            }
        }
        let steps = plan_route(&grid, (100, 100), (125, 125)).expect("a route to the wall");
        let &(ex, ey) = steps.last().unwrap();
        assert!(ex < 118 || ey < 118, "the route stays outside the walls");
        assert_eq!((125 - ex).abs().max((125 - ey).abs()), 8);
        // Standing at the wall, no tile gets any closer: that is unreachable.
        assert!(plan_route(&grid, (ex, ey), (125, 125)).is_none());
    }

    #[test]
    fn the_cache_follows_its_waypoints_in_order() {
        let grid = walled();
        let steps = plan_route(&grid, (100, 100), (125, 100)).unwrap();
        let mut cache = RouteCache {
            goal: (125, 100),
            steps: steps.clone(),
            ..Default::default()
        };
        let mut at = (100, 100);
        for _ in 0..steps.len() {
            let dir = cache.follow(&grid, at, (125, 100)).expect("a step");
            at = (at.0 + DIRECTIONS[dir].0, at.1 + DIRECTIONS[dir].1);
        }
        assert_eq!(at, (125, 100));
    }

    /// Answers this thread's planner gave from memory, and remembered searches it found outdated.
    fn memory() -> (u64, u64) {
        PLAN.with(|planner| {
            let planner = planner.borrow();
            (planner.reused, planner.outdated)
        })
    }

    /// A route from the planner (remembered or not) and from a fresh plain search, which must agree.
    fn both(grid: &WorldGrid, start: (i32, i32), target: (i32, i32)) -> Option<Vec<(i32, i32)>> {
        let planned = plan_route(grid, start, target);
        assert_eq!(
            planned,
            wide::plan_route(grid, start, target),
            "route {start:?} -> {target:?}"
        );
        planned
    }

    /// Open grass from 40 to 260 by 40 to 260.
    fn field() -> WorldGrid {
        let mut grid = WorldGrid::new(3);
        for y in 40..260 {
            for x in 40..260 {
                grid.set(x, y, Tile::Grass);
                grid.road[WorldGrid::idx(x, y)] = crate::world::grid::ROAD_NONE;
                grid.hazard[WorldGrid::idx(x, y)] = 0.0;
            }
        }
        grid
    }

    #[test]
    fn remembered_routes_match_a_fresh_search_as_the_map_changes() {
        let mut state = 0x0bad_5eed_1234_5678u64;
        let mut next = move |modulus: u64| {
            state ^= state << 13;
            state ^= state >> 7;
            state ^= state << 17;
            state % modulus
        };
        let before = memory();
        let mut grid = field();
        for y in 40..260 {
            for x in 40..260 {
                let i = WorldGrid::idx(x, y);
                match next(20) {
                    0..=3 => grid.set(x, y, Tile::Rock),
                    4 => {
                        grid.set(x, y, Tile::Water);
                        grid.depth[i] = next(40) as f32 / 100.0;
                    }
                    5 => grid.road[i] = crate::world::grid::ROAD_TRACK,
                    6 => grid.hazard[i] = next(100) as f32 / 100.0,
                    _ => {}
                }
            }
        }
        let queries: Vec<((i32, i32), (i32, i32))> = (0..40)
            .map(|_| {
                let start = (next(140) as i32 + 80, next(140) as i32 + 80);
                (
                    start,
                    (start.0 + next(90) as i32 - 45, start.1 + next(90) as i32 - 45),
                )
            })
            .collect();
        for round in 0..60 {
            for &(start, target) in &queries {
                both(&grid, start, target);
            }
            // Some rounds change nothing; the rest change a few tiles near the walkers or far away.
            if round % 4 == 0 {
                continue;
            }
            for _ in 0..next(6) + 1 {
                let (start, target) = queries[next(queries.len() as u64) as usize];
                let (x, y) = match next(4) {
                    0 => target,
                    1 => (start.0 + next(9) as i32 - 4, start.1 + next(9) as i32 - 4),
                    2 => (next(220) as i32 + 40, next(220) as i32 + 40),
                    _ => (start.0 + next(83) as i32 - 41, start.1 + next(83) as i32 - 41),
                };
                if !WorldGrid::in_bounds(x, y) {
                    continue;
                }
                let i = WorldGrid::idx(x, y);
                match next(9) {
                    0 => grid.set(x, y, Tile::Rock),
                    1 => grid.set(x, y, Tile::Fire),
                    2 => grid.set(x, y, Tile::Hut),
                    3 => grid.set(x, y, Tile::Grass),
                    4 => {
                        grid.set(x, y, Tile::Water);
                        grid.depth[i] = if next(2) == 0 { 0.17 } else { 0.19 };
                    }
                    5 => {
                        grid.road[i] = [
                            crate::world::grid::ROAD_NONE,
                            crate::world::grid::ROAD_TRACK,
                            crate::world::grid::ROAD_BRIDGE,
                            crate::world::grid::ROAD_RAIL,
                            crate::world::grid::ROAD_CANAL,
                        ][next(5) as usize]
                    }
                    // A nudge that usually leaves the step's cost as it was, and one that need not.
                    6 => grid.hazard[i] = (grid.hazard[i] + 0.001).min(1.0),
                    7 => grid.hazard[i] = next(100) as f32 / 100.0,
                    _ => grid.depth[i] = next(40) as f32 / 100.0,
                }
            }
        }
        let after = memory();
        assert!(
            after.0 - before.0 > 500,
            "answers from memory: {}",
            after.0 - before.0
        );
        assert!(
            after.1 - before.1 > 20,
            "outdated searches: {}",
            after.1 - before.1
        );
    }

    #[test]
    fn remembered_ties_and_exhausted_budgets_match_a_fresh_search() {
        let mut grid = field();
        // Open ground with a bar across each way: many routes round it cost the same, and the search
        // breaks the ties.
        let ties = [
            ((60, 70), (115, 72)),
            ((200, 200), (230, 200)),
            ((200, 100), (170, 70)),
        ];
        for y in 50..=110 {
            grid.set(78, y, Tile::Rock);
        }
        for y in 170..=230 {
            grid.set(215, y, Tile::Rock);
        }
        for x in 150..=220 {
            grid.set(x, 85, Tile::Rock);
        }
        // A target walled in far across open ground: the search runs to its budget.
        for y in 128..=140 {
            for x in 128..=140 {
                if y == 128 || y == 140 || x == 128 || x == 140 {
                    grid.set(x, y, Tile::Rock);
                }
            }
        }
        let walled = ((100, 140), (134, 134));
        let (_, expanded) = PLAN
            .with(|planner| planner.borrow_mut().search(&grid, walled.0, walled.1))
            .unwrap();
        assert_eq!(expanded, PLAN_BUDGET);
        for &(start, target) in &ties {
            let (_, expanded) = PLAN
                .with(|planner| planner.borrow_mut().search(&grid, start, target))
                .unwrap();
            assert!(
                expanded >= REMEMBER_EXPANDED,
                "{start:?} -> {target:?} expanded {expanded}"
            );
        }
        let before = memory();
        for &(start, target) in ties.iter().chain([&walled]) {
            let first = both(&grid, start, target);
            assert_eq!(both(&grid, start, target), first);
        }
        assert_eq!(memory().0 - before.0, 4, "each second ask comes from memory");
        // Block a tile of each chosen route and of a route as cheap beside it, then unblock it.
        for &(start, target) in ties.iter().chain([&walled]) {
            let route = both(&grid, start, target).expect("a route");
            for &(x, y) in [route[route.len() / 2], (route[1].0 + 1, route[1].1)].iter() {
                let was = grid.get(x, y);
                grid.set(x, y, Tile::Rock);
                both(&grid, start, target);
                grid.set(x, y, was);
                both(&grid, start, target);
            }
        }
        // A tile the exhausted search read near its far edge, then one it never reached.
        let reached = PLAN.with(|planner| {
            let planner = planner.borrow();
            let last = planner.read.iter().rposition(|&word| word != 0).unwrap();
            last * 64 + 63 - planner.read[last].leading_zeros() as usize
        });
        let far = (
            (reached % PLAN_SIDE) as i32 + walled.0 .0 - PLAN_RADIUS,
            (reached / PLAN_SIDE) as i32 + walled.0 .1 - PLAN_RADIUS,
        );
        let outdated = memory().1;
        both(&grid, walled.0, walled.1);
        grid.set(far.0, far.1, Tile::Fire);
        both(&grid, walled.0, walled.1);
        assert_eq!(
            memory().1,
            outdated + 1,
            "the far tile was read, so the answer is searched again"
        );
        grid.set(walled.0 .0 - PLAN_RADIUS - 1, walled.0 .1, Tile::Rock);
        let reused = memory().0;
        both(&grid, walled.0, walled.1);
        assert_eq!(
            memory().0,
            reused + 1,
            "a tile outside the window changes nothing"
        );
    }

    #[test]
    fn a_water_target_and_steep_costs_are_remembered_only_while_they_hold() {
        // A deep lake to the east: only its target tile may be entered, and only while it is water.
        let mut grid = field();
        for y in 60..240 {
            for x in 150..200 {
                grid.set(x, y, Tile::Water);
                grid.depth[WorldGrid::idx(x, y)] = 0.5;
            }
        }
        // A bar on the way, so the search is long enough to remember.
        for y in 80..=120 {
            grid.set(130, y, Tile::Rock);
        }
        let (start, target) = ((115, 100), (150, 100));
        let to_water = both(&grid, start, target).expect("a route");
        assert_eq!(to_water.last(), Some(&target));
        let reused = memory().0;
        assert_eq!(both(&grid, start, target), Some(to_water.clone()));
        assert_eq!(memory().0, reused + 1, "the second ask comes from memory");
        // The lake tile beside the target is never open, the target tile is open as water or as land.
        grid.set(target.0, target.1, Tile::Grass);
        assert_eq!(
            both(&grid, start, target).and_then(|steps| steps.last().copied()),
            Some(target)
        );
        grid.set(target.0, target.1 + 1, Tile::Grass);
        both(&grid, start, target);
        grid.set(target.0, target.1, Tile::Water);
        grid.set(target.0, target.1 + 1, Tile::Water);
        assert_eq!(both(&grid, start, target), Some(to_water));
        let (start, target) = ((115, 100), (151, 100));
        assert_ne!(
            both(&grid, start, target).and_then(|steps| steps.last().copied()),
            Some(target)
        );

        // A wall with two gaps: the near one costs 280 to step on (it does not fit a code), so the route
        // takes the far one. At a hazard whose cost is 280 truncated to a byte (24) it takes the near one.
        let mut grid = field();
        for y in 70..=130 {
            grid.set(100, y, Tile::Rock);
        }
        grid.set(100, 100, Tile::Grass);
        grid.set(100, 112, Tile::Grass);
        let i = WorldGrid::idx(100, 100);
        grid.hazard[i] = 9.0;
        assert_eq!(step_cost(&grid, 100, 100), 280);
        let (start, target) = ((95, 100), (105, 100));
        let around = both(&grid, start, target).expect("a route");
        assert!(around.contains(&(100, 112)));
        assert_eq!(both(&grid, start, target), Some(around.clone()));
        grid.hazard[i] = 14.0 / 30.0 + 1e-4;
        assert_eq!(step_cost(&grid, 100, 100), 24);
        let through = both(&grid, start, target).expect("a route");
        assert!(through.contains(&(100, 100)));
        assert_ne!(through, around);
    }

    #[test]
    fn an_older_remembered_search_is_checked_too() {
        // One search to a generation: each new one moves the last into the older generation.
        let mut planner = Planner {
            generation_bytes: 1,
            ..Planner::new()
        };
        let mut plan = |grid: &WorldGrid, start: (i32, i32), target: (i32, i32)| {
            let planned = planner.plan(grid, start, target).unwrap();
            assert_eq!(
                planned,
                wide::plan_route(grid, start, target),
                "{start:?} -> {target:?}"
            );
            planned
        };
        // Routes out of the cup and round its ridge: long enough searches to remember.
        let mut grid = walled();
        let (a, b) = (((100, 100), (125, 100)), ((100, 102), (125, 96)));
        let route = plan(&grid, a.0, a.1).expect("a route");
        plan(&grid, b.0, b.1);
        // `a` is now in the older generation; block its route.
        let (x, y) = route[route.len() / 2];
        grid.set(x, y, Tile::Rock);
        plan(&grid, a.0, a.1);
        plan(&grid, b.0, b.1);
        grid.set(x, y, Tile::Grass);
        plan(&grid, a.0, a.1);
        assert!(planner.reused > 0 && planner.outdated > 0);
    }

    #[test]
    fn a_lived_in_world_reuses_routes_and_each_matches_a_fresh_search() {
        // Every route planned is checked against `wide::plan_route` (see `plan_route`), with huts, roads,
        // fire and floods changing between the walkers of a tick.
        let before = memory();
        let mut sim = crate::sim::simulation::Simulation::new(42);
        sim.tick_n(3_000);
        let after = memory();
        assert!(
            after.0 - before.0 > 100,
            "answers from memory: {}",
            after.0 - before.0
        );
        assert!(after.1 > before.1, "no remembered search went out of date");
    }

    #[test]
    fn searches_match_the_unpacked_reference_on_random_terrain() {
        let mut state = 0x1234_5678_9abc_def1u64;
        let mut next = move |modulus: u64| {
            state ^= state << 13;
            state ^= state >> 7;
            state ^= state << 17;
            state % modulus
        };
        let mut grid = WorldGrid::new(5);
        for round in 0..30 {
            for y in 60..200 {
                for x in 60..200 {
                    let tile = match next(10) {
                        0 | 1 => Tile::Rock,
                        2 => Tile::Water,
                        3 => Tile::Fire,
                        _ => Tile::Grass,
                    };
                    grid.set(x, y, tile);
                    let i = WorldGrid::idx(x, y);
                    grid.hazard[i] = if next(6) == 0 {
                        next(100) as f32 / 40.0
                    } else {
                        0.0
                    };
                    grid.depth[i] = next(100) as f32 / 300.0;
                }
            }
            // Edge of the world too.
            let (sx, sy) = if round % 5 == 0 {
                (3, 4)
            } else {
                (next(100) as i32 + 80, next(100) as i32 + 80)
            };
            for _ in 0..40 {
                let start = (sx + next(9) as i32 - 4, sy + next(9) as i32 - 4);
                let target = (start.0 + next(120) as i32 - 60, start.1 + next(120) as i32 - 60);
                assert_eq!(
                    plan_route(&grid, start, target),
                    wide::plan_route(&grid, start, target),
                    "plan {start:?} -> {target:?}"
                );
                assert_eq!(
                    detour_step(&grid, start, target),
                    wide::detour_step(&grid, start, target),
                    "detour {start:?} -> {target:?}"
                );
            }
        }
    }
}
