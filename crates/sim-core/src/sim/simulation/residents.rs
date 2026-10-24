//! Who is alive this tick, for the lookups inside one person's turn that used
//! to walk the whole population: a partner or a sweetheart by id, the members
//! of one's own tribe. Each person asking once per tick made those walks
//! quadratic in the population.

use super::*;
use std::hash::BuildHasher;

/// Built once per tick, before the people take their turns. Every lookup
/// gives what the full scan it replaces gave: the same people, in population
/// order. That holds because the population changes during the turns only in
/// these ways:
///
/// - people die (`alive` goes false): every answer rechecks `alive`;
/// - newcomers are appended to `organisms` (a conception adds the unborn
///   child): the slots past the indexed length are scanned on every lookup;
/// - a band breaks off to found a new tribe (`fork_new_tribe`) and several
///   people change lineage at once: the founder's turn calls
///   [`Residents::lineages_changed`], which rebuilds the tribe lists.
///
/// Nobody comes back to life or changes id during the turns (births are
/// delivered before them). Test builds check every answer against the full
/// scan, so a change that breaks these assumptions fails the tests.
pub struct Residents {
    /// The living at tick start, by a hash of their id.
    by_id: FxHashMap<u64, Slot>,
    /// `organisms.len()` when `by_id` was built.
    ids_len: usize,
    /// The living by a hash of their lineage, in population order. Lineages
    /// whose hashes collide share a list; the lookup filters by lineage.
    by_lineage: FxHashMap<u64, Vec<usize>>,
    /// `organisms.len()` when `by_lineage` was built.
    lineages_len: usize,
}

#[derive(Clone, Copy)]
enum Slot {
    One(usize),
    /// Two of the living share the id's hash (or the id): look it up the slow way.
    Shared,
}

fn key(text: &str) -> u64 {
    std::hash::BuildHasherDefault::<crate::hashing::FxHasher>::default().hash_one(text)
}

fn lineage_lists(organisms: &[Organism]) -> FxHashMap<u64, Vec<usize>> {
    let mut by_lineage: FxHashMap<u64, Vec<usize>> = FxHashMap::default();
    for (i, o) in organisms.iter().enumerate() {
        if o.alive {
            by_lineage.entry(key(&o.lineage_id)).or_default().push(i);
        }
    }
    by_lineage
}

impl Residents {
    pub fn new(organisms: &[Organism]) -> Self {
        let mut by_id: FxHashMap<u64, Slot> =
            FxHashMap::with_capacity_and_hasher(organisms.len(), Default::default());
        for (i, o) in organisms.iter().enumerate() {
            if o.alive {
                by_id
                    .entry(key(&o.id))
                    .and_modify(|slot| *slot = Slot::Shared)
                    .or_insert(Slot::One(i));
            }
        }
        Self {
            by_id,
            ids_len: organisms.len(),
            by_lineage: lineage_lists(organisms),
            lineages_len: organisms.len(),
        }
    }

    /// Some people changed lineage: list the tribes again.
    pub(crate) fn lineages_changed(&mut self, organisms: &[Organism]) {
        self.by_lineage = lineage_lists(organisms);
        self.lineages_len = organisms.len();
    }

    /// The first living person with this id, as
    /// `organisms.iter().position(|o| o.alive && o.id == id)`.
    pub fn find_living(&self, organisms: &[Organism], id: &str) -> Option<usize> {
        let found = match self.by_id.get(&key(id)).copied() {
            Some(Slot::Shared) => organisms.iter().position(|o| o.alive && o.id == id),
            // Anyone before the indexed length who is alive now was alive at
            // tick start, so this slot is the only one there that can match.
            Some(Slot::One(i)) if organisms.get(i).is_some_and(|o| o.alive && o.id == id) => Some(i),
            _ => organisms
                .get(self.ids_len..)
                .unwrap_or(&[])
                .iter()
                .position(|o| o.alive && o.id == id)
                .map(|i| self.ids_len + i),
        };
        #[cfg(test)]
        assert_eq!(found, find_living_reference(organisms, id), "living person {id}");
        found
    }

    /// The living members of a lineage with their indices, in population
    /// order, as `organisms.iter().enumerate().filter(|(_, o)| o.alive && o.lineage_id == lineage)`.
    pub fn kin<'o>(
        &'o self,
        organisms: &'o [Organism],
        lineage: &'o str,
    ) -> impl Iterator<Item = (usize, &'o Organism)> + Clone + 'o {
        let listed = self.by_lineage.get(&key(lineage)).map_or(&[][..], Vec::as_slice);
        let newcomers = self.lineages_len..organisms.len().max(self.lineages_len);
        let members = listed
            .iter()
            .copied()
            .chain(newcomers)
            .map(move |i| (i, &organisms[i]))
            .filter(move |(_, o)| o.alive && o.lineage_id == lineage);
        #[cfg(test)]
        assert_eq!(
            members.clone().map(|(i, _)| i).collect::<Vec<_>>(),
            kin_reference(organisms, lineage)
                .map(|(i, _)| i)
                .collect::<Vec<_>>(),
            "members of {lineage}"
        );
        members
    }
}

/// The full scans `Residents` replaces, to check it against.
#[cfg(test)]
pub(crate) fn find_living_reference(organisms: &[Organism], id: &str) -> Option<usize> {
    organisms.iter().position(|o| o.alive && o.id == id)
}

#[cfg(test)]
pub(crate) fn kin_reference<'o>(
    organisms: &'o [Organism],
    lineage: &'o str,
) -> impl Iterator<Item = (usize, &'o Organism)> {
    organisms
        .iter()
        .enumerate()
        .filter(move |(_, o)| o.alive && o.lineage_id == lineage)
}
