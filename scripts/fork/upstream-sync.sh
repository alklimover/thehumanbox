#!/usr/bin/env bash
set -euo pipefail

# Merges upstream 1homsi/thehumanbox main into a fresh sync/upstream-YYYY-MM-DD
# branch cut from origin/main, applies the fork's known conflict rules, writes
# a Markdown report for the PR body and (unless --no-push) pushes the branch.
# Never use GitHub's "Sync fork" -> "Discard commits": it drops the fork's work.
#
# The merge happens in a temporary git worktree, so the current checkout is
# never switched or touched. Known conflict rules (from the first syncs):
#   - a file under .github/ that the fork deleted and upstream changed stays
#     deleted (upstream's pipeline.yml, desktop-release.yml, dependabot.yml);
#   - a version-only conflict in apps/desktop/package.json or
#     apps/web/package.json takes upstream's version;
#   - a conflict in a Russian locale file (apps/web/src/i18n/locales/ru/*.json,
#     apps/desktop/main/locales/ru.json) is merged key by key
#     (merge-locale-json.mjs): upstream's keys and texts, with the fork's
#     rewritten Russian kept on top; the report lists the kept texts whose
#     English upstream changed too;
#   - anything else stops the sync and lists the files.
# Rename detection is off for the merge: otherwise git follows upstream's
# desktop-release.yml into the fork's fork-release.yml and edits it silently.
#
# Exit codes: 0 merged or already up to date, 3 conflicts, 4 the merge changes
# workflow files and --refuse-workflow-changes was given, anything else error.
# The outcome is also written to OUT/result.env and, in Actions, $GITHUB_OUTPUT.

usage() {
  cat <<'EOF'
Usage: scripts/fork/upstream-sync.sh [options]

  --no-push                  merge and write the report, push nothing
  --date YYYY-MM-DD          date in the branch name (default: today, UTC)
  --out DIR                  where report.md, title.txt, result.env go
                             (default: a new temp directory)
  --skip-guards              do not install deps or run the vitest guards
  --refuse-workflow-changes  stop with exit 4 when the merge changes
                             .github/workflows (GITHUB_TOKEN cannot push those)
  --keep-worktree            keep the temporary worktree for inspection
  --force                    replace an existing local branch of the same name
  --base REF                 merge into REF instead of origin/main (testing;
                             implies --no-push)
  -h, --help                 this help
EOF
}

UPSTREAM_URL=https://github.com/1homsi/thehumanbox.git
VERSION_FILES=(apps/desktop/package.json apps/web/package.json)

push=1
date=$(date -u +%F)
out=
guards=1
refuse_workflows=0
keep_worktree=0
force=0
base_ref=refs/remotes/origin/main
while [ $# -gt 0 ]; do
  case "$1" in
    --no-push) push=0 ;;
    --date) date=$2; shift ;;
    --out) out=$2; shift ;;
    --skip-guards) guards=0 ;;
    --refuse-workflow-changes) refuse_workflows=1 ;;
    --keep-worktree) keep_worktree=1 ;;
    --force) force=1 ;;
    --base) base_ref=$2; push=0; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done
[[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "bad --date: $date" >&2; exit 2; }

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
cd "$ROOT"
out=${out:-$(mktemp -d "${TMPDIR:-/tmp}/upstream-sync.XXXXXX")}
mkdir -p "$out"
out=$(cd "$out" && pwd)
rm -f "$out"/{report.md,title.txt,result.env,conflicts.tsv,resolutions.tsv,locale-kept.tsv}
: >"$out/resolutions.tsv"
: >"$out/locale-kept.tsv"

result() {
  printf '%s=%s\n' "$1" "$2" >>"$out/result.env"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then printf '%s=%s\n' "$1" "$2" >>"$GITHUB_OUTPUT"; fi
}

log() { printf '==> %s\n' "$*" >&2; }

git remote get-url upstream >/dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"
log "fetching origin/main and upstream/main"
git fetch --no-tags --quiet origin main
git fetch --no-tags --quiet upstream main
base=$(git rev-parse "$base_ref^{commit}")
upstream=$(git rev-parse refs/remotes/upstream/main)
count=$(git rev-list --count "$base..$upstream")
result base "$base"
result upstream "$upstream"
result commits "$count"
result out "$out"

if [ "$count" -eq 0 ]; then
  log "origin/main already contains upstream/main ($(git rev-parse --short "$upstream")): nothing to do"
  result status up-to-date
  exit 0
fi
log "$count upstream commit(s) to merge"

# A same-day branch that is already merged into main belongs to an earlier
# sync: pick the next free suffix. One that is not merged yet is this run's
# own open sync, which gets replaced.
branch=sync/upstream-$date
remote_sha=
for n in '' -2 -3 -4 -5 -6 -7 -8 -9; do
  branch=sync/upstream-$date$n
  remote_sha=$(git ls-remote --heads origin "refs/heads/$branch" | cut -f1)
  [ -z "$remote_sha" ] && break
  git fetch --no-tags --quiet origin "refs/heads/$branch"
  git merge-base --is-ancestor "$remote_sha" "$base" || break
done
result branch "$branch"
log "branch $branch"

if git show-ref --verify --quiet "refs/heads/$branch"; then
  if [ "$force" -eq 1 ]; then
    git branch -D "$branch" >/dev/null
  else
    echo "local branch $branch already exists; delete it or pass --force" >&2
    exit 2
  fi
fi

merged=0
work=$(mktemp -d "${TMPDIR:-/tmp}/upstream-sync-wt.XXXXXX")
cleanup() {
  if [ "$keep_worktree" -eq 1 ]; then
    log "worktree kept at $work"
  else
    git -C "$ROOT" worktree remove --force "$work" >/dev/null 2>&1 || rm -rf "$work"
    # A sync that stopped leaves no half-made local branch behind.
    [ "$merged" -eq 1 ] || git -C "$ROOT" branch -D "$branch" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
git worktree add --quiet -b "$branch" "$work" "$base"

# Unmerged paths as "XY<TAB>path"; X is ours (the fork), Y is theirs (upstream).
unmerged() {
  git -C "$work" status --porcelain=v1 -z --untracked-files=no |
    while IFS= read -r -d '' entry; do
      case "${entry:0:2}" in
        DD | AU | UD | UA | DU | AA | UU) printf '%s\t%s\n' "${entry:0:2}" "${entry:3}" ;;
      esac
    done
}
message="Merge upstream 1homsi/thehumanbox main ($count commits) into the fork"

# The fork rewrites Russian texts in upstream's locale files, never their keys.
is_ru_locale() {
  [[ "$1" == apps/web/src/i18n/locales/ru/*.json || "$1" == apps/desktop/main/locales/ru.json ]]
}

# Merge one conflicted Russian locale file by key; the English beside it tells
# which kept fork texts may be out of date.
resolve_locale() {
  local path=$1 tmp en
  tmp=$(mktemp -d)
  git -C "$work" show ":1:$path" >"$tmp/base.json" 2>/dev/null || echo '{}' >"$tmp/base.json"
  git -C "$work" show ":2:$path" >"$tmp/ours.json" 2>/dev/null || echo '{}' >"$tmp/ours.json"
  git -C "$work" show ":3:$path" >"$tmp/theirs.json" || return 1
  if [[ "$path" == */ru.json ]]; then en=${path%ru.json}en.json; else en=${path/\/ru\//\/en\/}; fi
  git -C "$work" show "$base:$en" >"$tmp/en-base.json" 2>/dev/null || echo '{}' >"$tmp/en-base.json"
  git -C "$work" show "$upstream:$en" >"$tmp/en-theirs.json" 2>/dev/null || echo '{}' >"$tmp/en-theirs.json"
  node "$SCRIPT_DIR/merge-locale-json.mjs" --base "$tmp/base.json" --ours "$tmp/ours.json" \
    --theirs "$tmp/theirs.json" --out "$work/$path" --en-base "$tmp/en-base.json" \
    --en-theirs "$tmp/en-theirs.json" --report "$out/locale-kept.tsv" --label "$path" >>"$out/merge.log" 2>&1 || return 1
  rm -rf "$tmp"
  git -C "$work" add -- "$path"
  printf 'locale-merge\t%s\n' "$path" >>"$out/resolutions.tsv"
}

log "merging upstream/main into $branch"
if ! git -C "$work" merge --no-ff --no-edit --quiet -X no-renames -m "$message" "$upstream" >"$out/merge.log" 2>&1; then
  if ! git -C "$work" rev-parse --quiet --verify MERGE_HEAD >/dev/null; then
    cat "$out/merge.log" >&2
    exit 1
  fi
  while IFS=$'\t' read -r code path; do
    case "$code" in
      DU)
        if [[ "$path" == .github/* ]]; then
          git -C "$work" rm --quiet -- "$path"
          printf 'keep-deleted\t%s\n' "$path" >>"$out/resolutions.tsv"
        fi
        ;;
      DD)
        git -C "$work" rm --quiet -- "$path"
        ;;
      AA)
        if is_ru_locale "$path"; then resolve_locale "$path" || true; fi
        ;;
      UU)
        if is_ru_locale "$path"; then
          resolve_locale "$path" || true
          continue
        fi
        for file in "${VERSION_FILES[@]}"; do
          [ "$path" = "$file" ] || continue
          git -C "$work" checkout --conflict=diff3 -- "$path"
          if node "$SCRIPT_DIR/resolve-version-conflict.mjs" "$work/$path" 2>>"$out/merge.log"; then
            git -C "$work" add -- "$path"
            printf 'upstream-version\t%s\n' "$path" >>"$out/resolutions.tsv"
          fi
        done
        ;;
    esac
  done < <(unmerged)

  unmerged >"$out/conflicts.tsv"
  if [ -s "$out/conflicts.tsv" ]; then
    git -C "$work" merge --abort
    log "conflicts that need a human:"
    cut -f2 "$out/conflicts.tsv" | sed 's/^/    /' >&2
    node "$SCRIPT_DIR/sync-report.mjs" --mode conflict --repo "$work" --base "$base" --upstream "$upstream" \
      --branch "$branch" --date "$date" --conflicts "$out/conflicts.tsv" --resolutions "$out/resolutions.tsv" \
      --locale-kept "$out/locale-kept.tsv" --out "$out/report.md" --title-out "$out/title.txt"
    result status conflict
    exit 3
  fi
  git -C "$work" commit --quiet --no-edit
fi
head=$(git -C "$work" rev-parse HEAD)
merged=1
result head "$head"
log "merged: $(git -C "$work" log -1 --format='%h %s')"

workflow_changes=$(git -C "$work" diff --name-only "$base" "$head" -- .github/workflows)
if [ "$refuse_workflows" -eq 1 ] && [ -n "$workflow_changes" ]; then
  awk '{ print "workflow\t" $0 }' <<<"$workflow_changes" >"$out/conflicts.tsv"
  log "the merge changes workflow files, which GITHUB_TOKEN cannot push:"
  awk '{ print "    " $0 }' <<<"$workflow_changes" >&2
  node "$SCRIPT_DIR/sync-report.mjs" --mode workflows --repo "$work" --base "$base" --upstream "$upstream" \
    --branch "$branch" --date "$date" --conflicts "$out/conflicts.tsv" --resolutions "$out/resolutions.tsv" \
    --out "$out/report.md" --title-out "$out/title.txt"
  result status workflow-files
  exit 4
fi

report_args=()
if [ "$guards" -eq 1 ]; then
  log "installing apps/web dependencies in the worktree for the translation guards"
  if ! (cd "$work/apps/web" && pnpm install --frozen-lockfile --prefer-offline --reporter=silent) >>"$out/merge.log" 2>&1; then
    report_args+=(--skip-guards "pnpm install --frozen-lockfile упал, см. лог задания")
  fi
else
  report_args+=(--skip-guards "запуск с --skip-guards")
fi
log "writing the report"
node "$SCRIPT_DIR/sync-report.mjs" --mode pr --repo "$work" --base "$base" --upstream "$upstream" --head "$head" \
  --branch "$branch" --date "$date" --resolutions "$out/resolutions.tsv" --locale-kept "$out/locale-kept.tsv" \
  --out "$out/report.md" --title-out "$out/title.txt" ${report_args[@]+"${report_args[@]}"}
result status merged

if [ "$push" -eq 0 ]; then
  result pushed no
  log "--no-push: report in $out/report.md, local branch $branch"
  exit 0
fi

# Re-running on the same day replaces this run's own unmerged branch; the lease
# makes the push fail if somebody else moved it since the check above.
if [ -n "$remote_sha" ] && git merge-base --is-ancestor "$upstream" "$remote_sha" &&
  git merge-base --is-ancestor "$base" "$remote_sha"; then
  log "origin/$branch already has this merge; not pushing"
  result pushed unchanged
  exit 0
fi
log "pushing $branch"
git -C "$work" push --quiet --force-with-lease="refs/heads/$branch:$remote_sha" origin "HEAD:refs/heads/$branch"
result pushed yes
