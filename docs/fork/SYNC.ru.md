# Синхронизация с оригиналом

Форк забирает изменения [1homsi/thehumanbox](https://github.com/1homsi/thehumanbox) только через PR.

> **Не нажимайте на GitHub «Sync fork» → «Discard commits»:** это удалит все изменения форка.

## Как это работает

Раз в неделю, в понедельник в 06:00 UTC, запускается `.github/workflows/fork-upstream-sync.yml`. Его можно запустить и вручную: Actions → fork-upstream-sync → Run workflow.

1. `scripts/fork/upstream-sync.sh` создаёт ветку `sync/upstream-ГГГГ-ММ-ДД` от `main` форка и вливает в неё `upstream/main`. Если новых коммитов нет, ничего не происходит.
2. Известные конфликты решаются сами:
   - авторские файлы в `.github/`, которые форк удалил (`pipeline.yml`, `desktop-release.yml`, Dependabot), остаются удалёнными;
   - в `apps/desktop/package.json` и `apps/web/package.json` при конфликте только в поле `version` берётся версия автора;
   - русский перевод автора (`apps/web/src/i18n/locales/ru/*.json`, `apps/desktop/main/locales/ru.json`) сливается по ключам (`scripts/fork/merge-locale-json.mjs`): ключи и их порядок — авторские, текст, который менял только один, берётся у него, а если тексты переписали оба — остаётся текст форка. Такие ключи попадают в отчёт; если автор при этом поменял и английский, перевод форка мог устареть — их отчёт выделяет отдельно.
3. `scripts/fork/sync-report.mjs` пишет отчёт для описания PR:
   - коммиты автора и затронутые области;
   - **ключи интерфейса автора** (`locales/en` веба и десктопа): сколько новых и изменённых, у каких русский текст отсутствует или совпадает с английским (❌), и под спойлером — русские тексты автора для сверки с [глоссарием](GLOSSARY.ru.md);
   - проверки названий из симуляции (`apps/web/src/fork/i18n/sim/*.test.ts` и другие тесты слоя форка, которые читают исходники Rust): какие новые id остались без перевода;
   - новые английские строки в коде интерфейса вне `t()` автора и `ft()` / `simLabel()` / `simText()` форка. Это эвристика, среди находок бывают служебные строки;
   - новые тексты симуляции по данным экстрактора (`scripts/i18n/sim-strings-diff.mjs`);
   - переведённые фразы, которые автор переформулировал, и рядом новые тексты из того же файла Rust: такой ключ в `apps/web/src/fork/i18n/simtext/ru/*.ts` надо поправить, иначе `tables.test.ts` упадёт.
4. Ветка пушится, на ней запускается fork-ci, открывается PR с отчётом. Пуши от `GITHUB_TOKEN` сами CI не запускают, поэтому workflow запускает его явно, ссылка на прогон есть в PR.

Чтобы бот мог открывать PR, нужна настройка репозитория: **Settings → Actions → General → «Allow GitHub Actions to create and approve pull requests»**. Без неё бот кладёт ссылку «Создать PR» и готовый текст описания в сводку запуска (Actions → fork-upstream-sync → запуск) и завершает запуск ошибкой, чтобы GitHub прислал письмо. Если в репозитории включены issues, бот ещё и открывает issue с меткой `sync`.

## Как устроен перевод

С синхронизации 27.10.2026 интерфейс переводит **система автора** (upstream #729): `apps/web/src/i18n/index.ts` и `locales/<язык>/*.json`, двенадцать языков, переключатель в настройках. Форк держит рядом свой слой — `apps/web/src/fork/i18n/`:

| Что | Где | Функции |
|---|---|---|
| Интерфейс автора | `apps/web/src/i18n/locales/ru/*.json` — ключи авторские, тексты форк правит по глоссарию | `t()` автора |
| Строки, которые автор оставил английскими, и фичи форка (режимы, «Вся история», «Не пропустить важное», миры, вместимость, ядра, этапы загрузки, ошибки воркера…) | `apps/web/src/fork/i18n/catalog/*.ts` | `ft()`, `ftn()`, `fmtNumber()` |
| Тексты симуляции (мысли, события, летопись, новости) | `apps/web/src/fork/i18n/simtext/` | `simText()`, `simActor()` |
| Id симуляции, которых нет у автора (и падежи для текстов симуляции) | `apps/web/src/fork/i18n/sim/*.ts` | `simLabel()`, `simWordFallback()` |
| Имена людей и племён кириллицей | `apps/web/src/fork/i18n/names.ts` | `displayName()` |
| Язык | один, авторский; слой форка русский при русском, английский при любом другом | `getLocale()` из `fork/i18n/locale.ts` |
| Меню и диалоги десктопа | `apps/desktop/main/locales/ru.json` автора и `apps/desktop/main/fork-shell.ts` (название, ссылки, меню «Правка» и «Окно») | `t()` автора, `shellText()` |

По умолчанию игра — на русском, а не на языке браузера или системы (`preferredLocale` в `src/i18n/index.ts`, `public/splash-locale.js`, `initLocale` в `apps/desktop/main/index.ts`). Выбор хранится под тем же ключом `thb-locale`, что и раньше, поэтому у игроков язык не поменялся. Десктоп один раз читает старый файл форка `<userData>/ui-locale`, пока в `settings.json` нет языка.

**Где форк правит файлы автора** (здесь при слиянии возможны конфликты, разрешаются вручную):
- точки подключения в общих функциях автора: `shared/personName.ts` и `knownTribeName` в `state/worldStore.ts` (имена кириллицей), запасные словари в `ui/sim-words.ts`, `shared/era-words.ts`, `shared/government-words.ts` (`simWordFallback`), `ageInYears` в `game/model/calendar.ts` («30 лет»), `shortcut-text.ts` и `TimeControl.tsx` («Пробел»), `tool-search.ts` (ё = е);
- экраны, где показываются тексты симуляции и имена: вызовы `simText()` / `displayName()` / `simLabel()` поверх авторского кода;
- подключения фич форка: `App.tsx`, `main.tsx`, `DesktopSettingsModal.tsx`, `ChroniclesModal.tsx`, `MoreDropdown.tsx`, `TimeControl.tsx`; десктоп — `index.ts` (через `fork-shell.ts`), `ipc.ts` (одна строка `registerForkIpc`), `preload/index.ts`.

При разрешении такого конфликта берите сторону автора и возвращайте поверх вызовы форка: что именно было у форка, видно в `git diff <merge-base> origin/main -- <файл>`.

## Когда нужен человек

Бот ничего не пушит, а отчёт кладёт в сводку запуска (и в issue с меткой `sync`, если issues включены) и завершает запуск ошибкой, если:
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

Русский перевод автора при ручном слиянии сливается тем же скриптом:

```sh
git show :1:apps/web/src/i18n/locales/ru/dock.json > /tmp/base.json
git show :2:apps/web/src/i18n/locales/ru/dock.json > /tmp/ours.json
git show :3:apps/web/src/i18n/locales/ru/dock.json > /tmp/theirs.json
node scripts/fork/merge-locale-json.mjs --base /tmp/base.json --ours /tmp/ours.json --theirs /tmp/theirs.json \
  --out apps/web/src/i18n/locales/ru/dock.json
```

Проверить слияние локально, ничего не пуша:

```sh
scripts/fork/upstream-sync.sh --no-push --out /tmp/sync   # отчёт в /tmp/sync/report.md
```

## Непереведённое после слияния

- **Строка интерфейса, у которой у автора есть ключ** (❌ в разделе «Ключи интерфейса автора» или неудачный машинный перевод): правится текст в `apps/web/src/i18n/locales/ru/*.json` по [глоссарию](GLOSSARY.ru.md). Ключи и плейсхолдеры не трогаем: авторский `i18n.test.ts` проверяет, что они совпадают с английскими. Следующая синхронизация сохранит правку.
- **Строка, которую автор оставил английской** (находка эвристики или проверки на экране, [I18N-CHECK.ru.md](I18N-CHECK.ru.md)): ключ в `apps/web/src/fork/i18n/catalog/*.ts` и вызов `ft()` в месте вывода — одной правкой, чтобы следующий конфликт был маленьким.
- **Названия из симуляции** добавляются в `apps/web/src/fork/i18n/sim/*.ts`. Интерфейс сначала берёт слово из `locales/ru` автора, а если у автора ключа нет — из таблицы форка. Проверки останавливаются на первой непрошедшей, поэтому после исправления могут всплыть следующие.
- **Тексты симуляции** добавляются в `apps/web/src/fork/i18n/simtext/ru/*.ts` (см. [SIMTEXT.ru.md](SIMTEXT.ru.md)). Новые строки CI не роняют, пока доля переведённого текста выше порога. Долю и самые частые непереведённые строки видно в сводке job «Test frontend».
- Переводы можно добавить прямо в ветку синхронизации или следующим PR.
