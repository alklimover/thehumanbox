//! `GET /chronicle` (a page of entries, newest first) and `GET /chronicle/tribes`.

use std::sync::Arc;

use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;

use super::classify::Category;
use super::store::{ChronicleDb, Filter};
use super::Chronicle;

pub(crate) const DEFAULT_LIMIT: usize = 200;
pub(crate) const MAX_LIMIT: usize = 500;

pub(crate) fn routes<S: Clone + Send + Sync + 'static>() -> Router<S> {
    routes_for(super::global())
}

/// The routes over a given chronicle (the server's own, or a test's).
pub(crate) fn routes_for<S: Clone + Send + Sync + 'static>(chronicle: &'static Chronicle) -> Router<S> {
    Router::new()
        .route(
            "/chronicle",
            get(move |q: Query<PageQuery>| chronicle_handler(chronicle, q)),
        )
        .route("/chronicle/tribes", get(move || tribes_handler(chronicle)))
}

#[derive(Deserialize, Default, Debug)]
pub(crate) struct PageQuery {
    pub before_tick: Option<u64>,
    pub before_id: Option<i64>,
    /// Only entries newer than this id (the client's refresh of the top).
    pub after_id: Option<i64>,
    pub limit: Option<usize>,
    /// Comma-separated category keys; absent for all of them.
    pub kinds: Option<String>,
    pub lineage: Option<String>,
}

impl PageQuery {
    fn filter(&self) -> Option<Filter> {
        let categories = match &self.kinds {
            None => Vec::new(),
            Some(kinds) => {
                let parsed: Vec<Category> = kinds
                    .split(',')
                    .filter_map(|k| Category::from_key(k.trim()))
                    .collect();
                if parsed.is_empty() {
                    // Every heading switched off: nothing matches.
                    return None;
                }
                parsed
            }
        };
        let lineage = self
            .lineage
            .as_deref()
            .map(str::trim)
            .filter(|l| !l.is_empty())
            .map(str::to_string);
        Some(Filter { categories, lineage })
    }
}

fn no_store(body: serde_json::Value) -> Response {
    ([(axum::http::header::CACHE_CONTROL, "no-store")], Json(body)).into_response()
}

fn unavailable() -> Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(serde_json::json!({ "ok": false, "error": "this world has no chronicle" })),
    )
        .into_response()
}

pub(crate) fn page(db: &ChronicleDb, q: &PageQuery) -> rusqlite::Result<serde_json::Value> {
    let limit = q.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let first_page = q.before_tick.is_none() && q.after_id.is_none();
    let point = db.resume_point()?;
    let Some(filter) = q.filter() else {
        return Ok(serde_json::json!({
            "ok": true, "rows": [], "years": [], "total": 0, "started_tick": point.started,
        }));
    };
    let before = q.before_tick.map(|t| (t, q.before_id.unwrap_or(i64::MAX)));
    let rows = db.page(&filter, before, q.after_id, limit)?;
    let mut body = serde_json::json!({
        "ok": true,
        "rows": rows,
        "started_tick": point.started,
        "more": rows.len() == limit,
    });
    if first_page {
        let years = db.years(&filter)?;
        body["total"] = years.iter().map(|y| y.count).sum::<u64>().into();
        body["years"] = serde_json::to_value(years).unwrap_or_default();
    }
    Ok(body)
}

async fn chronicle_handler(chronicle: &Chronicle, Query(q): Query<PageQuery>) -> Response {
    let Some(db) = chronicle.db() else {
        return unavailable();
    };
    run(db, move |db| page(db, &q)).await
}

async fn tribes_handler(chronicle: &Chronicle) -> Response {
    let Some(db) = chronicle.db() else {
        return unavailable();
    };
    run(db, |db| {
        Ok(serde_json::json!({ "ok": true, "tribes": db.tribes()? }))
    })
    .await
}

/// sqlite behind a std mutex: query off the reactor.
async fn run(
    db: Arc<ChronicleDb>,
    query: impl FnOnce(&ChronicleDb) -> rusqlite::Result<serde_json::Value> + Send + 'static,
) -> Response {
    match tokio::task::spawn_blocking(move || query(&db)).await {
        Ok(Ok(body)) => no_store(body),
        Ok(Err(error)) => {
            tracing::warn!(target: "chronicle", "query failed: {}", error);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "ok": false, "error": "chronicle query failed" })),
            )
                .into_response()
        }
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}
