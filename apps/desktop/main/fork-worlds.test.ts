import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";

import { worldSeedEnv } from "./fork-world-seed";
import { listWorlds, seedFromText } from "./fork-worlds";

test("a seed is a number as typed, a hash of any other text, or random when empty", () => {
  assert.equal(seedFromText("12345"), "12345");
  assert.equal(seedFromText(" 42 "), "42");
  assert.equal(seedFromText(""), null);
  assert.equal(seedFromText(null), null);
  const word = seedFromText("лето");
  assert.match(word ?? "", /^\d+$/);
  assert.equal(seedFromText("лето"), word);
  assert.notEqual(seedFromText("зима"), word);
  // Zero and numbers past u64 are hashed like text, never passed through.
  assert.notEqual(seedFromText("0"), "0");
  assert.ok(BigInt(seedFromText("99999999999999999999") ?? "0") < 1n << 64n);
  assert.deepEqual(worldSeedEnv(), {});
});

test("the worlds of a save folder, the playing one first, without parked or broken entries", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "thb-worlds-"));
  const world = (hash: string, mtime: number, meta?: object) => {
    fs.mkdirSync(path.join(dir, hash));
    const save = path.join(dir, hash, "world.save");
    fs.writeFileSync(save, "{}");
    fs.utimesSync(save, mtime, mtime);
    if (meta)
      fs.writeFileSync(
        path.join(dir, hash, "fork-world.json"),
        JSON.stringify(meta),
      );
  };
  world("aaaa", 1000, { name: "Острова", seed: "7", createdAt: 5 });
  world("bbbb", 3000);
  world("cccc", 2000);
  fs.mkdirSync(path.join(dir, ".failed-reset-x-dddd"));
  fs.mkdirSync(path.join(dir, "empty"));
  fs.writeFileSync(path.join(dir, "_live"), "aaaa\n");
  // A world just minted has no save yet: listed only while it is the live one.
  assert.deepEqual(
    listWorlds(dir).map((w) => w.hash),
    ["aaaa", "bbbb", "cccc"],
  );
  fs.writeFileSync(path.join(dir, "_live"), "empty\n");
  assert.deepEqual(
    listWorlds(dir).map((w) => [w.hash, w.sizeBytes]),
    [
      ["empty", 0],
      ["bbbb", 2],
      ["cccc", 2],
      ["aaaa", 2],
    ],
  );
  fs.writeFileSync(path.join(dir, "_live"), "aaaa\n");

  const list = listWorlds(dir);
  assert.deepEqual(
    list.map((w) => [w.hash, w.live]),
    [
      ["aaaa", true],
      ["bbbb", false],
      ["cccc", false],
    ],
  );
  assert.equal(list[0].name, "Острова");
  assert.equal(list[0].seed, "7");
  assert.equal(list[1].name, null);
  assert.deepEqual(listWorlds(path.join(dir, "missing")), []);
});
