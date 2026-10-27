import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";
import type { MenuItemConstructorOptions } from "electron";
import { legacyLocale, shellText, withTranslatedRoleMenus } from "./fork-shell";
import { setLocale } from "./i18n";

test("the fork's wording wins over upstream's, and the rest is upstream's translation", () => {
  setLocale(["ru"]);
  assert.equal(shellText("menu.about"), "О программе The Human Box RU");
  assert.equal(shellText("menu.openWebsite"), "Оригинальный проект (1homsi/thehumanbox)");
  assert.equal(shellText("menu.file"), "Файл");
  assert.match(shellText("notify.about", { version: "0.8.0" }), /^v0\.8\.0\n.*Мохамада Хомси\.$/s);
  setLocale(["en"]);
  assert.equal(shellText("menu.quitApp"), "Quit The Human Box RU");
  assert.equal(shellText("menu.file"), "File");
});

test("a language without fork texts falls back to the fork's English", () => {
  setLocale(["de"]);
  assert.equal(shellText("menu.undo"), "Undo");
  assert.equal(shellText("menu.file"), "Datei");
  setLocale(["en"]);
});

test("the edit and window role menus get translated items; everything else is left alone", () => {
  setLocale(["ru"]);
  const file: MenuItemConstructorOptions = { label: "Файл", submenu: [] };
  const menu = withTranslatedRoleMenus([file, { role: "editMenu" }, { role: "windowMenu" }], true);
  assert.equal(menu[0], file);
  const edit = menu[1].submenu as MenuItemConstructorOptions[];
  assert.equal(menu[1].label, "Правка");
  assert.deepEqual(
    edit.map((item) => item.label ?? item.type),
    ["Отменить", "Повторить", "separator", "Вырезать", "Копировать", "Вставить", "Выбрать всё"],
  );
  const window = menu[2].submenu as MenuItemConstructorOptions[];
  assert.equal(window.at(-1)?.role, "front");
  const windows = withTranslatedRoleMenus([{ role: "windowMenu" }], false);
  assert.equal((windows[0].submenu as MenuItemConstructorOptions[]).at(-1)?.label, "Закрыть окно");
  setLocale(["en"]);
});

test("the old fork language file is read when it holds a language", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "thb-locale-"));
  assert.equal(legacyLocale(dir), null);
  fs.writeFileSync(path.join(dir, "ui-locale"), "en\n");
  assert.equal(legacyLocale(dir), "en");
  fs.writeFileSync(path.join(dir, "ui-locale"), "xx");
  assert.equal(legacyLocale(dir), null);
});
