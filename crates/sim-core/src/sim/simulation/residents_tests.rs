//! `Residents` against the full scans it replaced. Test builds also check
//! every lookup the simulation makes (see `residents.rs`), so the ticks run
//! here compare each answer the people get during their turns.

use super::residents::{find_living_reference, kin_reference};
use super::*;
use crate::organism::traits::Traits;
use crate::sim::agents::growth;

fn person(id: &str, lineage: &str, x: f32) -> Organism {
    let mut o = Organism::new(
        id.into(),
        id.into(),
        x,
        10.0,
        0,
        String::new(),
        lineage.into(),
        9000,
        Traits::default(),
    );
    o.alive = true;
    o
}

/// Every id and lineage in `people`, and some nobody has, looked up both ways.
fn assert_lookups_match(residents: &Residents, people: &[Organism], when: &str) {
    let mut ids: Vec<&str> = people.iter().map(|o| o.id.as_str()).collect();
    ids.extend(["nobody", ""]);
    for id in ids {
        assert_eq!(
            residents.find_living(people, id),
            find_living_reference(people, id),
            "{when}: id {id}"
        );
    }
    let mut lineages: Vec<&str> = people.iter().map(|o| o.lineage_id.as_str()).collect();
    lineages.extend(["no-tribe", ""]);
    for lineage in lineages {
        let fast: Vec<usize> = residents.kin(people, lineage).map(|(i, _)| i).collect();
        let full: Vec<usize> = kin_reference(people, lineage).map(|(i, _)| i).collect();
        assert_eq!(fast, full, "{when}: lineage {lineage}");
    }
}

#[test]
fn lookups_follow_deaths_newcomers_and_new_tribes() {
    let tribes = ["river", "hill", "ash", ""];
    let mut people: Vec<Organism> = (0..80)
        .map(|i| {
            let mut o = person(&format!("p{i}"), tribes[i % 4], i as f32);
            o.alive = i % 7 != 3;
            o
        })
        .collect();
    // Two of the living share an id, and the dead share ids with the living.
    people[22].id = "twin".into();
    people[46].id = "twin".into();
    people[10].id = "p50".into();
    people[24].id = "p60".into();
    assert!(people[22].alive && people[46].alive);
    assert!(!people[10].alive && !people[24].alive && people[50].alive && people[60].alive);
    let mut residents = Residents::new(&people);
    assert_lookups_match(&residents, &people, "tick start");

    // Deaths during the turns, the first twin among them.
    for i in [0, 22, 33, 50, 79] {
        people[i].alive = false;
    }
    assert_lookups_match(&residents, &people, "after deaths");

    // Newcomers appended during the turns: the unborn, and living ones with
    // fresh ids, ids of the living and of the dead, in old and new tribes.
    let mut unborn = person("unborn", "river", 3.0);
    unborn.alive = false;
    people.push(unborn);
    people.push(person("fresh", "hill", 4.0));
    people.push(person("p60", "ash", 5.0));
    people.push(person("p33", "river", 6.0));
    people.push(person("p2", "", 7.0));
    people.push(person("guest", "far-tribe", 8.0));
    assert_lookups_match(&residents, &people, "after newcomers");

    // A founder leaves with a band; one of them arrived this tick.
    for i in [5, 9, 13, 81] {
        people[i].lineage_id = "new-tribe".into();
    }
    residents.lineages_changed(&people);
    assert_lookups_match(&residents, &people, "after a new tribe");

    // More deaths and newcomers after the tribe lists were rebuilt.
    people[13].alive = false;
    people[46].alive = false;
    people.push(person("late", "new-tribe", 9.0));
    people.push(person("twin", "hill", 10.0));
    assert_lookups_match(&residents, &people, "after the rebuild");
}

/// Many people of a few tribes crowded together, in couples and in love,
/// elders and children among them, so the lookups the simulation makes for
/// partners, sweethearts, elders and kin all come up.
fn crowded_world(seed: u64) -> Simulation {
    let mut sim = Simulation::new(seed);
    sim.set_population_limit(400);
    // Past the first wait between children, so couples conceive.
    sim.tick_count = 2_000;
    let alive: Vec<usize> = (0..sim.organisms.len())
        .filter(|&i| sim.organisms[i].alive)
        .collect();
    let (cx, cy) = (sim.organisms[alive[0]].x, sim.organisms[alive[0]].y);
    let lineages: Vec<String> = alive
        .iter()
        .map(|&i| sim.organisms[i].lineage_id.clone())
        .take(3)
        .collect();
    for k in 0..240usize {
        let (dx, dy) = ((k % 16) as f32 - 8.0, (k / 16) as f32 - 7.0);
        growth::spawn_organism_with_home(
            &sim.grid,
            &mut sim.organisms,
            cx + dx,
            cy + dy,
            cx,
            cy,
            lineages[k % lineages.len()].clone(),
            &mut sim.rng,
        );
    }
    let n = sim.organisms.len();
    for i in 0..n {
        let o = &mut sim.organisms[i];
        if !o.alive {
            continue;
        }
        o.age = [200, 300, 800, 1500, 2500, 4000][i % 6];
        o.max_age = o.max_age.max(6000);
        o.is_elder = i % 6 == 5;
        o.energy = 0.9;
        o.hydration = 0.9;
        o.traits.curiosity = 0.6;
        o.loneliness = if i % 5 == 0 { 0.7 } else { 0.2 };
    }
    for i in (0..n - 1).step_by(2) {
        let (a, b) = (sim.organisms[i].id.clone(), sim.organisms[i + 1].id.clone());
        match i % 8 {
            0 | 2 => {
                sim.organisms[i].partner_id = Some(b);
                sim.organisms[i + 1].partner_id = Some(a);
            }
            4 => sim.organisms[i + 1].attracted_to = Some(a),
            _ => {}
        }
    }
    // Some die in their turn of the first tick while their partners and
    // admirers, later in the order, still ask after them.
    for i in (0..n).step_by(16) {
        sim.organisms[i].energy = 0.0;
    }
    sim
}

#[test]
fn crowded_ticks_look_up_people_as_the_full_scans_did() {
    for seed in [3u64, 11] {
        let mut sim = crowded_world(seed);
        let deaths_before = sim.organisms.iter().filter(|o| !o.alive).count();
        let slots_before = sim.organisms.len();
        // Each lookup is checked as the people make it.
        sim.tick_n(300);
        let deaths = sim.organisms.iter().filter(|o| !o.alive).count() - deaths_before;
        assert!(deaths > 5, "seed {seed}: {deaths} died");
        assert!(
            sim.organisms.len() > slots_before,
            "seed {seed}: no child conceived"
        );
    }
}

/// A founder leaves with a band during their own turn; whoever asks after the
/// new tribe later in the same tick must find the whole band.
#[test]
fn a_founders_band_is_listed_under_its_new_tribe_at_once() {
    let mut forks = 0;
    for seed in 0..12u64 {
        let mut sim = crowded_world(seed);
        for o in sim.organisms.iter_mut() {
            o.energy = o.energy.max(0.9);
            o.age = o.age.max(1500);
        }
        let lineage_counts = growth::lineage_population_slots(&sim.organisms);
        let spatial = SpatialIndex::build(&sim.organisms, 10);
        let animal_spatial = SpatialIndex::build_animals(&sim.animals, 10);
        let mut buffers = TickBuffers::new();
        let org_idx_by_id: FxHashMap<String, usize> = sim
            .organisms
            .iter()
            .enumerate()
            .filter(|(_, o)| o.alive)
            .map(|(i, o)| (o.id.clone(), i))
            .collect();
        let mut lineage_members = lineage_member_index(&sim.organisms);
        let mut residents = Residents::new(&sim.organisms);
        let slots = growth::population_slots_used(&sim.organisms);
        for idx in 0..sim.organisms.len() {
            if !sim.organisms[idx].alive {
                continue;
            }
            let before = sim.organisms[idx].lineage_id.clone();
            sim.tick_organism(
                idx,
                slots,
                &lineage_counts,
                &spatial,
                &animal_spatial,
                &mut buffers,
                &org_idx_by_id,
                &mut lineage_members,
                &mut residents,
            );
            let after = sim.organisms[idx].lineage_id.clone();
            if after != before {
                let band = residents.kin(&sim.organisms, &after).count();
                assert!(band >= 2, "seed {seed}: the founder left alone");
                forks += 1;
            }
        }
    }
    assert!(forks > 0, "no founder left in any world");
}
