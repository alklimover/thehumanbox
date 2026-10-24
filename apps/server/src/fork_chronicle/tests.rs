use std::collections::HashSet;
use std::path::PathBuf;

use sim_core::sim::simulation::Simulation;

use super::capture::Cursor;
use super::classify::fingerprint;
use super::routes::{page, PageQuery};
use super::store::{EntryJson, Filter};
use super::Chronicle;

fn tmp_root(label: &str) -> PathBuf {
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let root = std::env::temp_dir().join(format!("thb_chronicle_{label}_{}_{unique}", std::process::id()));
    std::fs::create_dir_all(&root).unwrap();
    root
}

/// Every kept line the world holds for its current tick: what the chronicle
/// must have for that tick once the next tick starts. Read straight from the
/// logs, without the cursor whose exactly-once taking is under test.
fn entries_of_this_tick(sim: &Simulation) -> Vec<(u64, String, i64)> {
    let now = sim.tick_count;
    super::capture::lines_since(sim, now)
        .into_iter()
        .filter(|l| l.tick == now)
        .map(|l| (l.tick, l.source.key().to_string(), l.fp))
        .collect()
}

fn all_rows(chronicle: &Chronicle) -> Vec<EntryJson> {
    chronicle.flush();
    let db = chronicle.db().expect("a live chronicle");
    let mut rows = db.page(&Filter::default(), None, None, usize::MAX >> 2).unwrap();
    rows.reverse();
    rows
}

/// The rows the logs could have produced (no server rows, no restored eras), sorted.
fn logged(rows: &[EntryJson]) -> Vec<(u64, String, i64)> {
    let db_fp = |e: &EntryJson| match e.src.as_str() {
        "event" => fingerprint(&["e", &e.kind, &e.actor, &e.text]),
        "headline" => fingerprint(&["h", &e.text]),
        _ => fingerprint(&["s", &e.actor, &e.text]),
    };
    let mut out: Vec<(u64, String, i64)> = rows
        .iter()
        .filter(|r| matches!(r.src.as_str(), "event" | "headline" | "story"))
        .map(|r| (r.tick, r.src.clone(), db_fp(r)))
        .collect();
    out.sort();
    out
}

/// A headline that repeats an event keeps the event's kind and actor, so its
/// fingerprint is rebuilt from the text alone; events keep theirs.
fn sorted(mut v: Vec<(u64, String, i64)>) -> Vec<(u64, String, i64)> {
    v.sort();
    v
}

/// Runs `ticks` ticks in batches of `batch`, capturing after every tick the
/// way `step_period` does, and returns what the world held for each tick.
fn run(
    chronicle: &Chronicle,
    sim: &mut Simulation,
    hash: &str,
    ticks: u64,
    batch: u64,
) -> Vec<(u64, String, i64)> {
    let mut expected = Vec::new();
    let mut done = 0;
    while done < ticks {
        for _ in 0..batch.min(ticks - done) {
            // The previous tick is complete once the next one starts.
            expected.extend(entries_of_this_tick(sim));
            sim.tick();
            chronicle.after_tick(sim, Some(hash));
            done += 1;
        }
    }
    expected
}

fn earthquake_at_someone(sim: &mut Simulation) -> bool {
    let Some(o) = sim.organisms.iter().find(|o| o.alive) else {
        return false;
    };
    let cmd = format!(
        r#"{{"cmd":"earthquake","x":{},"y":{},"radius":4}}"#,
        o.x as i32, o.y as i32
    );
    sim.apply_command_json(&cmd)
}

#[test]
fn every_entry_is_taken_exactly_once_across_batches_and_commands() {
    let root = tmp_root("once");
    let chronicle = Chronicle::new(Some(root.clone()));
    let mut sim = Simulation::new(42);
    sim.tick_n(400);
    chronicle.attach(&sim, "w1", true);
    // Everything before the attach went in as restored; count from here.
    let before: Vec<(u64, String, i64)> = logged(&all_rows(&chronicle));

    let mut expected = Vec::new();
    for round in 0..40u64 {
        // A fast-forward batch (up to 64 ticks), then player commands between two ticks.
        expected.extend(run(
            &chronicle,
            &mut sim,
            "w1",
            1 + (round * 7) % 64,
            1 + (round * 7) % 64,
        ));
        assert!(earthquake_at_someone(&mut sim), "the command applies");
        if round % 3 == 0 {
            // A capture with no tick in between (a command hook, a resumed world) changes nothing.
            chronicle.after_tick(&sim, Some("w1"));
            assert!(earthquake_at_someone(&mut sim));
        }
    }
    expected.extend(run(&chronicle, &mut sim, "w1", 1, 1));

    let rows = all_rows(&chronicle);
    let got: Vec<(u64, String, i64)> = logged(&rows)
        .into_iter()
        .filter(|r| !before.contains(r))
        .collect();
    // The last tick is still open: what it holds so far is in, the rest comes with the next tick.
    let open = sim.tick_count;
    let mut want: Vec<(u64, String, i64)> = expected.into_iter().filter(|e| e.0 > 400).collect();
    want.extend(entries_of_this_tick(&sim).into_iter().filter(|e| e.0 == open));
    assert_eq!(sorted(got), sorted(want));

    let quakes = rows.iter().filter(|r| r.kind == "earthquake").count();
    assert!(
        quakes >= 40,
        "every earthquake of the player is in the chronicle once: {quakes}"
    );
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn a_reset_sends_each_world_to_its_own_chronicle() {
    let root = tmp_root("reset");
    let chronicle = Chronicle::new(Some(root.clone()));
    let mut old = Simulation::new(42);
    chronicle.attach(&old, "old", true);
    let want_old = run(&chronicle, &mut old, "old", 700, 32);
    let old_rows = all_rows(&chronicle);

    // archive_and_reset swaps the world and its store under the tick's lock.
    let mut new = Simulation::new(7);
    let want_new = run(&chronicle, &mut new, "new", 700, 32);
    let new_rows = all_rows(&chronicle);
    assert_eq!(chronicle.db().unwrap().hash(), "new");

    let old_open = old.tick_count;
    let mut want_old: Vec<_> = want_old;
    want_old.extend(entries_of_this_tick(&old).into_iter().filter(|e| e.0 == old_open));
    assert_eq!(logged(&old_rows), sorted(want_old));
    // What the new world held when it was attached was taken then; the rest came tick by tick.
    let new_open = new.tick_count;
    let mut want_new: Vec<_> = want_new;
    want_new.extend(entries_of_this_tick(&new).into_iter().filter(|e| e.0 == new_open));
    assert_eq!(logged(&new_rows), sorted(want_new));
    assert!(
        new_rows.iter().all(|r| !r.restored),
        "a new world is not salvaged"
    );

    // The old world's database got nothing more after the reset.
    let again = Chronicle::new(Some(root.clone()));
    again.attach(&old, "old", false);
    assert_eq!(logged(&all_rows(&again)), logged(&old_rows));
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn a_crash_drops_what_the_save_never_saw_and_takes_up_again_without_doubles() {
    let root = tmp_root("crash");
    let save = root.join("world.save");
    let save = save.to_string_lossy().to_string();

    let chronicle = Chronicle::new(Some(root.clone()));
    let mut sim = Simulation::new(42);
    chronicle.attach(&sim, "w", true);
    let mut want = run(&chronicle, &mut sim, "w", 1500, 16);
    sim_core::sim::persistence::write_save_to_disk(&sim.to_save_state(), &save).unwrap();
    want.extend(entries_of_this_tick(&sim));
    // Lived on past the save, then the process died.
    run(&chronicle, &mut sim, "w", 600, 16);
    chronicle.flush();
    drop(chronicle);

    let restarted = Chronicle::new(Some(root.clone()));
    let mut loaded = Simulation::load_or_new(42, &save);
    assert_eq!(loaded.tick_count, 1500);
    restarted.attach(&loaded, "w", true);
    let rows = all_rows(&restarted);
    assert!(
        rows.iter().all(|r| r.tick <= 1500),
        "nothing after the save survives"
    );
    assert!(
        rows.iter().all(|r| !r.restored),
        "a world with a chronicle is not salvaged"
    );
    want.retain(|e| e.0 <= 1500);
    assert_eq!(logged(&rows), sorted(want.clone()));

    // Lives the 600 ticks again: each once.
    let lived = run(&restarted, &mut loaded, "w", 600, 16);
    want.extend(lived.into_iter().filter(|e| e.0 > 1500));
    let open = loaded.tick_count;
    want.extend(entries_of_this_tick(&loaded).into_iter().filter(|e| e.0 == open));
    assert_eq!(logged(&all_rows(&restarted)), sorted(want));
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn lines_the_writer_lost_are_taken_again_from_the_saved_logs() {
    let root = tmp_root("lost");
    let save = root.join("world.save").to_string_lossy().to_string();
    let chronicle = Chronicle::new(Some(root.clone()));
    let mut sim = Simulation::new(42);
    chronicle.attach(&sim, "w", true);
    let mut want = run(&chronicle, &mut sim, "w", 900, 8);
    chronicle.flush();
    // The last captures never reached the database (the process was killed).
    let mut detached = Cursor::resume(&sim, sim.tick_count, Vec::new());
    for _ in 0..12 {
        want.extend(entries_of_this_tick(&sim));
        sim.tick();
        detached.capture(&sim, false);
    }
    // Something the player did just before the save.
    assert!(earthquake_at_someone(&mut sim));
    want.extend(entries_of_this_tick(&sim));
    sim_core::sim::persistence::write_save_to_disk(&sim.to_save_state(), &save).unwrap();
    drop(chronicle);

    let restarted = Chronicle::new(Some(root.clone()));
    let loaded = Simulation::load_or_new(42, &save);
    restarted.attach(&loaded, "w", true);
    let got = logged(&all_rows(&restarted));
    let unique: HashSet<_> = got.iter().collect();
    assert_eq!(unique.len(), got.len(), "no line twice");
    // What the saved logs still hold of the lost ticks is back; nothing else is invented.
    let saved_events: HashSet<i64> = loaded
        .events
        .iter()
        .map(|e| fingerprint(&["e", &e.etype, &e.actor, &e.detail]))
        .chain(loaded.headlines.iter().map(|h| fingerprint(&["h", &h.1])))
        .collect();
    let lost_and_saved: Vec<_> = want
        .iter()
        .filter(|e| e.0 > 900 && saved_events.contains(&e.2))
        .cloned()
        .collect();
    assert!(!lost_and_saved.is_empty(), "the test needs lost lines to recover");
    for line in &lost_and_saved {
        assert!(got.contains(line), "lost line {line:?} was not recovered");
    }
    for line in &got {
        assert!(want.contains(line), "{line:?} was never in the world");
    }
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn an_old_world_gets_what_is_left_of_its_history_marked_restored() {
    let root = tmp_root("salvage");
    let save = root.join("world.save").to_string_lossy().to_string();
    let mut sim = Simulation::new(42);
    sim.tick_n(3000);
    sim_core::sim::persistence::write_save_to_disk(&sim.to_save_state(), &save).unwrap();
    let loaded = Simulation::load_or_new(42, &save);

    let chronicle = Chronicle::new(Some(root.clone()));
    chronicle.attach(&loaded, "old", true);
    let rows = all_rows(&chronicle);
    assert!(!rows.is_empty());
    assert!(
        rows.iter().all(|r| r.restored),
        "everything taken from the logs is marked"
    );
    let eras: Vec<&EntryJson> = rows.iter().filter(|r| r.cat == "eras").collect();
    assert!(
        loaded
            .history
            .era_history
            .iter()
            .all(|e| eras.iter().any(|r| r.tick == e.tick)),
        "every era on the ladder is in"
    );
    let db = chronicle.db().unwrap();
    assert_eq!(db.resume_point().unwrap().started, Some(3000));

    // A second start finds the chronicle begun: nothing is taken twice or marked again.
    drop(chronicle);
    let again = Chronicle::new(Some(root.clone()));
    again.attach(&loaded, "old", true);
    assert_eq!(all_rows(&again), rows);
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn a_tribe_with_nobody_left_is_noticed_and_a_raised_one_comes_back() {
    let mut sim = Simulation::new(42);
    sim.tick_n(300);
    let mut cursor = Cursor::resume(&sim, sim.tick_count, Vec::new());
    let lid = sim.organisms.iter().find(|o| o.alive).unwrap().lineage_id.clone();
    let name = sim.lineage_names.get(&lid).cloned().unwrap();
    let members: Vec<usize> = (0..sim.organisms.len())
        .filter(|&i| sim.organisms[i].alive && sim.organisms[i].lineage_id == lid)
        .collect();
    for &i in &members {
        sim.organisms[i].alive = false;
        sim.history.record_death(sim.tick_count);
    }
    let capture = cursor.capture(&sim, false);
    assert_eq!(capture.died_out.len(), 1);
    assert_eq!(capture.died_out[0].0, lid);
    let peak = sim.lineage_peak_pop.get(&lid).copied().unwrap_or(0);
    let row = capture.rows.iter().find(|r| r.kind == super::capture::DIED_OUT);
    if peak >= 8 {
        assert!(row.is_none(), "the dynasty watch tells it");
    } else {
        let row = row.expect("a small tribe's end gets a line");
        assert_eq!(row.tribes, vec![(lid.clone(), name.clone())]);
    }
    assert!(cursor.capture(&sim, false).is_empty(), "noticed once");

    // Raised from the dead: no death and nobody new, so the next regular census sees it.
    sim.organisms[members[0]].alive = true;
    assert!(cursor.capture(&sim, false).revived.is_empty());
    sim.tick_count += 300;
    let capture = cursor.capture(&sim, false);
    assert_eq!(capture.revived, vec![lid]);
}

fn query(q: &str) -> PageQuery {
    let mut out = PageQuery::default();
    for pair in q.split('&').filter(|p| !p.is_empty()) {
        let (k, v) = pair.split_once('=').unwrap();
        match k {
            "before_tick" => out.before_tick = v.parse().ok(),
            "before_id" => out.before_id = v.parse().ok(),
            "after_id" => out.after_id = v.parse().ok(),
            "limit" => out.limit = v.parse().ok(),
            "kinds" => out.kinds = Some(v.to_string()),
            "lineage" => out.lineage = Some(v.to_string()),
            _ => panic!("{k}"),
        }
    }
    out
}

fn ids(body: &serde_json::Value) -> Vec<i64> {
    body["rows"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| r["id"].as_i64().unwrap())
        .collect()
}

#[test]
fn the_page_route_filters_pages_and_counts() {
    let root = tmp_root("pages");
    let chronicle = Chronicle::new(Some(root.clone()));
    let mut sim = Simulation::new(42);
    chronicle.attach(&sim, "w", true);
    run(&chronicle, &mut sim, "w", 4000, 64);
    let all = all_rows(&chronicle);
    let db = chronicle.db().unwrap();
    assert!(all.len() > 120, "a lived-in world: {}", all.len());

    // Newest first, in pages that meet without a gap or an overlap.
    let first = page(&db, &query("limit=50")).unwrap();
    assert_eq!(first["total"].as_u64().unwrap() as usize, all.len());
    assert_eq!(first["more"], true);
    let mut seen = ids(&first);
    let mut body = first;
    while body["more"] == true {
        let last = body["rows"].as_array().unwrap().last().unwrap().clone();
        body = page(
            &db,
            &query(&format!(
                "limit=50&before_tick={}&before_id={}",
                last["tick"], last["id"]
            )),
        )
        .unwrap();
        assert!(body.get("years").is_none(), "only the first page counts");
        seen.extend(ids(&body));
    }
    let mut want: Vec<i64> = all.iter().map(|r| r.id).collect();
    want.reverse();
    assert_eq!(seen, want);

    // Years add up to the total and run newest first.
    let first = page(&db, &query("")).unwrap();
    let years = first["years"].as_array().unwrap();
    let sum: u64 = years.iter().map(|y| y["count"].as_u64().unwrap()).sum();
    assert_eq!(sum, first["total"].as_u64().unwrap());

    // Headings and a tribe.
    let eras = page(&db, &query("kinds=eras,war")).unwrap();
    assert!(eras["rows"]
        .as_array()
        .unwrap()
        .iter()
        .all(|r| r["cat"] == "eras" || r["cat"] == "war"));
    assert_eq!(
        page(&db, &query("kinds=")).unwrap()["rows"]
            .as_array()
            .unwrap()
            .len(),
        0
    );
    assert_eq!(page(&db, &query("kinds=nonsense")).unwrap()["total"], 0);
    let lid = all
        .iter()
        .find_map(|r| r.tribes.first().map(|t| t.id.clone()))
        .expect("lines name tribes");
    let tribe = page(&db, &query(&format!("lineage={lid}&limit=500"))).unwrap();
    let rows = tribe["rows"].as_array().unwrap();
    assert!(!rows.is_empty());
    assert!(rows.iter().all(|r| r["tribes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|t| t["id"] == lid.as_str())));
    assert_eq!(
        tribe["total"].as_u64().unwrap() as usize,
        all.iter()
            .filter(|r| r.tribes.iter().any(|t| t.id == lid))
            .count()
    );

    // The refresh of the top: only what came after the newest id the client has.
    let newest = all.last().unwrap().id;
    run(&chronicle, &mut sim, "w", 600, 64);
    chronicle.flush();
    let fresh = page(&db, &query(&format!("after_id={newest}"))).unwrap();
    assert!(ids(&fresh).iter().all(|id| *id > newest));
    assert!(!ids(&fresh).is_empty());

    // The tribes the chronicle names, with their entries.
    let all = all_rows(&chronicle);
    let tribes = db.tribes().unwrap();
    let t = tribes.iter().find(|t| t.id == lid).unwrap();
    assert_eq!(
        t.entries as usize,
        all.iter()
            .filter(|r| r.tribes.iter().any(|x| x.id == lid))
            .count()
    );
    let _ = std::fs::remove_dir_all(root);
}

/// The routes answer JSON from the live world's chronicle, and 503 without one.
#[tokio::test]
async fn the_routes_answer_from_the_live_world() {
    use tower::ServiceExt;
    let root = tmp_root("routes");
    let chronicle: &'static Chronicle = Box::leak(Box::new(Chronicle::new(Some(root.clone()))));
    let app = super::routes::routes_for::<()>(chronicle);
    let get = |uri: &str| {
        axum::http::Request::builder()
            .uri(uri)
            .body(axum::body::Body::empty())
            .unwrap()
    };
    let none = app.clone().oneshot(get("/chronicle")).await.unwrap();
    assert_eq!(none.status(), axum::http::StatusCode::SERVICE_UNAVAILABLE);

    let mut sim = Simulation::new(42);
    chronicle.attach(&sim, "w", true);
    run(chronicle, &mut sim, "w", 800, 64);
    chronicle.flush();
    let page = app
        .clone()
        .oneshot(get("/chronicle?limit=5&kinds=eras,tribes,milestones"))
        .await
        .unwrap();
    assert_eq!(page.status(), axum::http::StatusCode::OK);
    let body: serde_json::Value =
        serde_json::from_slice(&axum::body::to_bytes(page.into_body(), usize::MAX).await.unwrap()).unwrap();
    let tribes = app.oneshot(get("/chronicle/tribes")).await.unwrap();
    assert_eq!(tribes.status(), axum::http::StatusCode::OK);
    let tribes: serde_json::Value = serde_json::from_slice(
        &axum::body::to_bytes(tribes.into_body(), usize::MAX)
            .await
            .unwrap(),
    )
    .unwrap();
    let _ = std::fs::remove_dir_all(root);

    assert_eq!(body["ok"], true);
    assert_eq!(body["rows"].as_array().unwrap().len(), 5);
    assert_eq!(body["started_tick"], 0);
    assert!(body["total"].as_u64().unwrap() >= 5);
    assert!(!tribes["tribes"].as_array().unwrap().is_empty());
}

/// A measurement, not a check: what capturing costs per tick on a saved world,
/// and how much the chronicle grows.
/// `THB_CHRONICLE_BENCH_SAVE=<world.save> THB_CHRONICLE_BENCH_TICKS=2000 cargo test --release -p simulation-rs -- --ignored --nocapture capture_cost`
#[test]
#[ignore = "a measurement over a saved world"]
fn capture_cost_on_a_saved_world() {
    let Ok(save) = std::env::var("THB_CHRONICLE_BENCH_SAVE") else {
        eprintln!("set THB_CHRONICLE_BENCH_SAVE");
        return;
    };
    let ticks: usize = std::env::var("THB_CHRONICLE_BENCH_TICKS")
        .ok()
        .and_then(|t| t.parse().ok())
        .unwrap_or(1000);
    let root = tmp_root("bench");
    let mut sim = Simulation::load_or_new(1, &save);
    let alive = sim.organisms.iter().filter(|o| o.alive).count();
    let chronicle = Chronicle::new(Some(root.clone()));
    chronicle.attach(&sim, "bench", true);
    chronicle.flush();
    let salvaged = chronicle.db().unwrap().count().unwrap();
    let twins_before = super::capture::OTHER_WORDS_TWINS.load(std::sync::atomic::Ordering::Relaxed);
    let mut tick_ns = Vec::with_capacity(ticks);
    let mut capture_ns = Vec::with_capacity(ticks);
    for _ in 0..ticks {
        let t0 = std::time::Instant::now();
        sim.tick();
        let t1 = std::time::Instant::now();
        chronicle.after_tick(&sim, Some("bench"));
        let t2 = std::time::Instant::now();
        tick_ns.push((t1 - t0).as_nanos() as u64);
        capture_ns.push((t2 - t1).as_nanos() as u64);
    }
    chronicle.flush();
    let db = chronicle.db().unwrap();
    let rows = db.count().unwrap() - salvaged;
    let twins = super::capture::OTHER_WORDS_TWINS.load(std::sync::atomic::Ordering::Relaxed) - twins_before;
    if let Ok(dump) = std::env::var("THB_CHRONICLE_BENCH_DUMP") {
        let all = db.page(&Filter::default(), None, None, usize::MAX >> 2).unwrap();
        std::fs::write(
            dump,
            serde_json::to_vec(&serde_json::json!({ "rows": all })).unwrap(),
        )
        .unwrap();
    }
    db.checkpoint().unwrap();
    let stats = |v: &mut Vec<u64>| {
        v.sort_unstable();
        let mean = v.iter().sum::<u64>() as f64 / v.len() as f64;
        (mean, v[v.len() / 2], v[v.len() * 99 / 100], *v.last().unwrap())
    };
    let (tm, tp50, _, _) = stats(&mut tick_ns);
    let (cm, cp50, cp99, cmax) = stats(&mut capture_ns);
    let bytes = std::fs::metadata(root.join("bench").join("world.sqlite")).map_or(0, |m| m.len());
    eprintln!(
        "{alive} alive, from tick {}: {ticks} ticks, tick mean {:.2} ms (p50 {:.2}); capture mean {:.1} µs, \
         p50 {:.1} µs, p99 {:.1} µs, max {:.1} µs; {rows} rows ({salvaged} salvaged), {:.0} rows per 100k ticks; \
         database {:.2} MB ({:.0} bytes a row); {twins} events folded into their headlines \
         ({:.0} per 100k ticks)",
        sim.tick_count - ticks as u64,
        tm / 1e6,
        tp50 as f64 / 1e6,
        cm / 1e3,
        cp50 as f64 / 1e3,
        cp99 as f64 / 1e3,
        cmax as f64 / 1e3,
        rows as f64 * 100_000.0 / ticks as f64,
        bytes as f64 / 1e6,
        bytes as f64 / (rows + salvaged).max(1) as f64,
        twins as f64 * 100_000.0 / ticks as f64,
    );
    let _ = std::fs::remove_dir_all(root);
}
