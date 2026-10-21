# Синхронизация с оригиналом

Форк забирает изменения [1homsi/thehumanbox](https://github.com/1homsi/thehumanbox) только через PR.

> **Не нажимайте на GitHub «Sync fork» → «Discard commits»:** это удалит все изменения форка.

## Как это работает

Раз в неделю, в понедельник в 06:00 UTC, запускается `.github/workflows/fork-upstream-sync.yml`. Его можно запустить и вручную: Actions → fork-upstream-sync → Run workflow.

1. `scripts/fork/upstream-sync.sh` создаёт ветку `sync/upstream-ГГГГ-ММ-ДД` от `main` форка и вливает в неё `upstream/main`. Если новых коммитов нет, ничего не происходит.
2. Известные конфликты решаются сами:
   - авторские файлы в `.github/`, которые форк удалил (`pipeline.yml`, `desktop-release.yml`, Dependabot), остаются удалёнными;
   - в `apps/desktop/package.json` и `apps/web/package.json` при конфликте только в поле `version` берётся версия автора.
3. `scripts/fork/sync-report.mjs` пишет отчёт для описания PR:
   - коммиты автора и затронутые области;
   - проверки названий из симуляции (`apps/web/src/i18n/sim/*.test.ts`): какие новые id остались без перевода;
   - новые английские строки в интерфейсе вне `t()` / `tn()` / `simLabel()`. Это эвристика, среди находок бывают служебные строки;
   - число новых строк в `crates/sim-core`. Когда появится экстрактор текстов симуляции (v0.4), отчёт будет звать `scripts/i18n/sim-strings-diff.mjs`.
4. Ветка пушится, на ней запускается fork-ci, открывается PR с отчётом. Пуши от `GITHUB_TOKEN` сами CI не запускают, поэтому workflow запускает его явно, ссылка на прогон есть в PR.

Чтобы бот мог открывать PR, нужна настройка репозитория: **Settings → Actions → General → «Allow GitHub Actions to create and approve pull requests»**. Без неё бот открывает issue с меткой `sync`: там ссылка «Создать PR» и готовый текст описания.

## Когда нужен человек

Бот открывает issue с меткой `sync` и ничего не пушит, если:
- есть конфликт вне известных правил (в issue список файлов);
- автор изменил файлы в `.github/workflows`: `GITHUB_TOKEN` не может пушить такие изменения.

Синхронизация вручную:

```sh
git fetch origin && git fetch upstream
git switch -c sync/upstream-$(date -u +%F) origin/main
git merge -X no-renames upstream/main
# разрешить конфликты, затем git add … && git commit
git push -u origin HEAD
gh pr create -R alklimover/thehumanbox --base main
```

`-X no-renames` обязателен: без него git принимает авторский `desktop-release.yml` за переименованный `fork-release.yml` и молча правит наш файл.

Проверить слияние локально, ничего не пуша:

```sh
scripts/fork/upstream-sync.sh --no-push --out /tmp/sync   # отчёт в /tmp/sync/report.md
```

## Непереведённое после слияния

- Названия из симуляции добавляются в `apps/web/src/i18n/sim/*.ts`. Проверки останавливаются на первой непрошедшей, поэтому после исправления могут всплыть следующие.
- Строки интерфейса переносятся в каталоги `apps/web/src/i18n/catalog/*.ts` по [глоссарию](GLOSSARY.ru.md). Английский текст в каталоге должен совпадать с авторским байт в байт.
- Переводы можно добавить прямо в ветку синхронизации или следующим PR.
