import * as fs from "node:fs";
import * as path from "node:path";
import type { MenuItemConstructorOptions } from "electron";
import { getLocale, resolveText, t, type MessageKey, type Messages, type Vars } from "./i18n";

/**
 * The fork's own layer over the shell's translations (./i18n and ./locales are
 * upstream's): its name and links, the edit and window menus spelled out so
 * they can be translated, the default language and the move from the fork's
 * old language file. index.ts calls in here at a few points only.
 */

export const FORK_APP_NAME = "The Human Box RU";
export const FORK_REPO_URL = "https://github.com/alklimover/thehumanbox";
export const UPSTREAM_REPO_URL = "https://github.com/1homsi/thehumanbox";

/** This fork is the Russian edition: with no language saved yet, the shell starts in Russian. */
export const FORK_DEFAULT_LOCALE = "ru";

/**
 * The language the fork's shell kept before it used upstream's translations
 * (`<userData>/ui-locale`, "ru" or "en"). Read only while settings.json has no
 * language yet: the game reports its language as soon as it starts, and from
 * then on settings.json holds it.
 */
export function legacyLocale(userDataDir: string): string | null {
  try {
    const value = fs.readFileSync(path.join(userDataDir, "ui-locale"), "utf8").trim();
    return value === "ru" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

/** Fork texts: upstream keys the fork words differently, and the menus upstream leaves to Electron. */
const FORK_EN = {
  menu: {
    about: "About The Human Box RU",
    hide: "Hide The Human Box RU",
    quitApp: "Quit The Human Box RU",
    openWebsite: "Original project (1homsi/thehumanbox)",
    edit: "Edit",
    undo: "Undo",
    redo: "Redo",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    selectAll: "Select All",
    window: "Window",
    minimize: "Minimize",
    zoom: "Zoom",
    front: "Bring All to Front",
  },
  notify: {
    about:
      "v{version}\nA persistent artificial-life simulation.\nBased on The Human Box by Mohamad Homsi.",
  },
};

const FORK_RU: typeof FORK_EN = {
  menu: {
    about: "О программе The Human Box RU",
    hide: "Скрыть The Human Box RU",
    quitApp: "Завершить The Human Box RU",
    openWebsite: "Оригинальный проект (1homsi/thehumanbox)",
    edit: "Правка",
    undo: "Отменить",
    redo: "Повторить",
    cut: "Вырезать",
    copy: "Копировать",
    paste: "Вставить",
    selectAll: "Выбрать всё",
    window: "Окно",
    minimize: "Свернуть",
    zoom: "Изменить масштаб",
    front: "Все окна — на передний план",
  },
  notify: {
    about:
      "v{version}\nНепрерывная симуляция искусственной жизни.\nОснована на The Human Box Мохамада Хомси.",
  },
};

type ForkKey =
  | `menu.${keyof typeof FORK_EN.menu}`
  | `notify.${keyof typeof FORK_EN.notify}`;

function forkTable(): Messages {
  return getLocale() === "ru" ? FORK_RU : FORK_EN;
}

function isForkKey(key: string): key is ForkKey {
  const [area, name] = key.split(".");
  return area in FORK_EN && name in FORK_EN[area as keyof typeof FORK_EN];
}

/** The shell text for `key`: the fork's wording where it has one, else upstream's translation. */
export function shellText(key: MessageKey | ForkKey, vars?: Vars): string {
  if (isForkKey(key)) return resolveText(forkTable(), key, vars, FORK_EN);
  return t(key, vars);
}

/**
 * Upstream's menu with the edit and window menus spelled out: Electron's role
 * menus are English whatever the language, so the fork lists their items with
 * translated labels.
 */
export function withTranslatedRoleMenus(
  template: MenuItemConstructorOptions[],
  isMac: boolean,
): MenuItemConstructorOptions[] {
  return template.map((item) => {
    if (item.role === "editMenu" && !item.submenu) {
      return {
        role: "editMenu",
        label: shellText("menu.edit"),
        submenu: [
          { role: "undo", label: shellText("menu.undo") },
          { role: "redo", label: shellText("menu.redo") },
          { type: "separator" },
          { role: "cut", label: shellText("menu.cut") },
          { role: "copy", label: shellText("menu.copy") },
          { role: "paste", label: shellText("menu.paste") },
          { role: "selectAll", label: shellText("menu.selectAll") },
        ],
      };
    }
    if (item.role === "windowMenu" && !item.submenu) {
      return {
        role: "windowMenu",
        label: shellText("menu.window"),
        submenu: [
          { role: "minimize", label: shellText("menu.minimize") },
          { role: "zoom", label: shellText("menu.zoom") },
          ...(isMac
            ? [
                { type: "separator" as const },
                { role: "front" as const, label: shellText("menu.front") },
              ]
            : [{ role: "close" as const, label: t("menu.close") }]),
        ],
      };
    }
    return item;
  });
}
