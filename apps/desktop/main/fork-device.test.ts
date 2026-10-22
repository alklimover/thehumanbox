import assert from "node:assert/strict";
import test from "node:test";

import { cachedBench, parseBenchOutput } from "./fork-device";

test("the bench result is the ms per tick of the last JSON line", () => {
  assert.equal(
    parseBenchOutput('{"alive":120,"bench":1,"ms_per_tick":1.04,"seed":1,"ticks":1000}\n'),
    1.04,
  );
  assert.equal(
    parseBenchOutput('log line\n{"bench":1,"ms_per_tick":2.5}\n{"bench":1,"ms_per_tick":1.5}'),
    1.5,
  );
  assert.equal(parseBenchOutput(""), null);
  assert.equal(parseBenchOutput("not json"), null);
  assert.equal(parseBenchOutput('{"bench":1,"ms_per_tick":0}'), null);
  assert.equal(parseBenchOutput('{"bench":1,"ms_per_tick":"fast"}'), null);
});

test("a cached bench counts only for the app version that measured it", () => {
  const record = { appVersion: "0.6.25", benchMsPerTick: 1.7, measuredAt: 1 };
  assert.equal(cachedBench(record, "0.6.25"), 1.7);
  assert.equal(cachedBench(record, "0.6.26"), null);
  assert.equal(cachedBench({ ...record, benchMsPerTick: -1 }, "0.6.25"), null);
  assert.equal(cachedBench(null, "0.6.25"), null);
  assert.equal(cachedBench("junk", "0.6.25"), null);
});
