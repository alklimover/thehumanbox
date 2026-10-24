//! The chronicle's own writer thread: the tick hands it what it captured and
//! goes on; rows reach the database in batches, at most a second or 200 rows
//! late. Each capture travels with the database of the world it came from.

use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::sync::Arc;
use std::time::{Duration, Instant};

use super::capture::Capture;
use super::store::ChronicleDb;

pub(crate) const FLUSH_AFTER: Duration = Duration::from_secs(1);
pub(crate) const FLUSH_ROWS: usize = 200;

enum Job {
    Write(Arc<ChronicleDb>, Capture),
    /// Write everything queued, then answer.
    Flush(mpsc::SyncSender<()>),
}

pub(crate) struct Writer {
    tx: Sender<Job>,
}

impl Writer {
    pub(crate) fn spawn() -> Self {
        let (tx, rx) = mpsc::channel();
        if let Err(error) = std::thread::Builder::new()
            .name("chronicle-writer".into())
            .spawn(move || run(rx))
        {
            tracing::warn!(target: "chronicle", "could not start the writer: {}", error);
        }
        Writer { tx }
    }

    pub(crate) fn send(&self, db: Arc<ChronicleDb>, capture: Capture) {
        if capture.is_empty() {
            return;
        }
        let _ = self.tx.send(Job::Write(db, capture));
    }

    /// Waits until everything sent so far is in the database (or `timeout` passes).
    pub(crate) fn flush(&self, timeout: Duration) {
        let (done_tx, done_rx) = mpsc::sync_channel(1);
        if self.tx.send(Job::Flush(done_tx)).is_ok() {
            let _ = done_rx.recv_timeout(timeout);
        }
    }
}

fn run(rx: Receiver<Job>) {
    let mut pending: Vec<(Arc<ChronicleDb>, Capture)> = Vec::new();
    let mut rows = 0usize;
    let mut since: Option<Instant> = None;
    loop {
        let job = match since {
            Some(at) => match rx.recv_timeout(FLUSH_AFTER.saturating_sub(at.elapsed())) {
                Ok(job) => Some(job),
                Err(RecvTimeoutError::Timeout) => None,
                Err(RecvTimeoutError::Disconnected) => {
                    write_all(&mut pending);
                    return;
                }
            },
            None => match rx.recv() {
                Ok(job) => Some(job),
                Err(_) => return,
            },
        };
        match job {
            Some(Job::Write(db, capture)) => {
                rows += capture.rows.len();
                since.get_or_insert_with(Instant::now);
                pending.push((db, capture));
                if rows < FLUSH_ROWS && since.is_some_and(|at| at.elapsed() < FLUSH_AFTER) {
                    continue;
                }
            }
            Some(Job::Flush(done)) => {
                write_all(&mut pending);
                rows = 0;
                since = None;
                let _ = done.send(());
                continue;
            }
            None => {}
        }
        write_all(&mut pending);
        rows = 0;
        since = None;
    }
}

/// One transaction per run of captures for the same world.
fn write_all(pending: &mut Vec<(Arc<ChronicleDb>, Capture)>) {
    let mut batch: Vec<Capture> = Vec::new();
    let mut current: Option<Arc<ChronicleDb>> = None;
    for (db, capture) in pending.drain(..) {
        if current.as_ref().is_some_and(|c| !Arc::ptr_eq(c, &db)) {
            if let Some(c) = current.take() {
                write_batch(&c, &batch);
            }
            batch.clear();
        }
        current = Some(db);
        batch.push(capture);
    }
    if let Some(c) = current {
        write_batch(&c, &batch);
    }
}

fn write_batch(db: &ChronicleDb, batch: &[Capture]) {
    if let Err(error) = db.write(batch) {
        tracing::warn!(target: "chronicle", "worlds/{}: could not write the chronicle: {}", db.hash(), error);
    }
}
