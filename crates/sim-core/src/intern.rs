//! One shared copy of a name that many organisms hold.
//!
//! Every person keeps the names of their discoveries in an ordered set. The
//! same few hundred names recur across thousands of people, and as `String`s
//! each copy was its own heap block: a third of the memory a grown world's
//! people use. A [`Name`] is a shared, immutable `str` that orders, compares,
//! hashes and serialises exactly like the `String` it replaces, so sets of
//! names iterate in the same order and saves are byte-identical.

use std::sync::{Arc, Mutex, OnceLock};

use crate::hashing::FxHashSet;

pub type Name = Arc<str>;

fn pool() -> &'static Mutex<FxHashSet<Name>> {
    static POOL: OnceLock<Mutex<FxHashSet<Name>>> = OnceLock::new();
    POOL.get_or_init(Default::default)
}

/// The shared copy of `text`, made on first use. Names are few and never
/// freed: the pool holds each distinct name once for the life of the process.
pub fn intern(text: &str) -> Name {
    let mut pool = pool().lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if let Some(name) = pool.get(text) {
        return name.clone();
    }
    let name: Name = Arc::from(text);
    pool.insert(name.clone());
    name
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_text_shares_one_copy() {
        let a = intern("pottery");
        let b = intern(&String::from("pottery"));
        assert!(Arc::ptr_eq(&a, &b));
        assert_eq!(&*a, "pottery");
        assert!(!Arc::ptr_eq(&a, &intern("weaving")));
    }

    #[test]
    fn names_order_like_strings() {
        let words = ["fire", "Fire", "fir", "fire2", "", "ёж", "zeal"];
        let mut as_strings: Vec<String> = words.iter().map(|w| w.to_string()).collect();
        let mut as_names: Vec<Name> = words.iter().map(|w| intern(w)).collect();
        as_strings.sort();
        as_names.sort();
        assert_eq!(as_names.iter().map(|n| &**n).collect::<Vec<_>>(), as_strings);
    }
}
