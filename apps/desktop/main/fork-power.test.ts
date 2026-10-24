import assert from "node:assert/strict";
import test from "node:test";

import {
  decidePowerMode,
  parseLowPowerMode,
  taskpolicyArgs,
  type PowerInputs,
} from "./fork-power";

const cool: PowerInputs = {
  onBattery: false,
  lowPowerMode: false,
  thermalState: "nominal",
};

test("on mains power and cool, the simulation has the performance cores", () => {
  assert.deepEqual(decidePowerMode(cool), { mode: "performance", reason: null });
  assert.deepEqual(decidePowerMode({ ...cool, thermalState: "fair" }), {
    mode: "performance",
    reason: null,
  });
  // A Mac that does not report its thermal state is not taken for a hot one.
  assert.deepEqual(decidePowerMode({ ...cool, thermalState: "unknown" }), {
    mode: "performance",
    reason: null,
  });
});

test("battery, Low Power Mode or heat move it to the efficiency cores", () => {
  assert.deepEqual(decidePowerMode({ ...cool, onBattery: true }), {
    mode: "efficiency",
    reason: "battery",
  });
  assert.deepEqual(decidePowerMode({ ...cool, lowPowerMode: true }), {
    mode: "efficiency",
    reason: "low-power",
  });
  assert.deepEqual(decidePowerMode({ ...cool, thermalState: "serious" }), {
    mode: "efficiency",
    reason: "thermal",
  });
  assert.deepEqual(decidePowerMode({ ...cool, thermalState: "critical" }), {
    mode: "efficiency",
    reason: "thermal",
  });
});

test("a hidden or minimised window does not matter: the world keeps the performance cores", () => {
  // Window visibility is not an input at all, so mains power and a cool Mac
  // are enough for the performance cores.
  assert.deepEqual(Object.keys(cool).sort(), ["lowPowerMode", "onBattery", "thermalState"]);
  assert.deepEqual(decidePowerMode(cool), { mode: "performance", reason: null });
});

test("the reason shown is the most telling one", () => {
  const everything: PowerInputs = {
    onBattery: true,
    lowPowerMode: true,
    thermalState: "critical",
  };
  assert.equal(decidePowerMode(everything).reason, "thermal");
  assert.equal(decidePowerMode({ ...everything, thermalState: "nominal" }).reason, "low-power");
  assert.equal(
    decidePowerMode({ ...everything, thermalState: "nominal", lowPowerMode: false }).reason,
    "battery",
  );
});

test("Low Power Mode is read from pmset on old and new macOS", () => {
  assert.equal(parseLowPowerMode(" lowpowermode         1\n sleep 1"), true);
  assert.equal(parseLowPowerMode(" lowpowermode         0\n"), false);
  assert.equal(parseLowPowerMode("Currently in use:\n standby 1\n powermode            1\n"), true);
  assert.equal(parseLowPowerMode(" powermode            0\n"), false);
  // High Power Mode is not Low Power Mode.
  assert.equal(parseLowPowerMode(" powermode            2\n"), false);
  assert.equal(parseLowPowerMode(" hibernatemode        1\n"), false);
  assert.equal(parseLowPowerMode(""), false);
});

test("taskpolicy demotes with -b and restores with -B", () => {
  assert.deepEqual(taskpolicyArgs("efficiency", 4242), ["-b", "-p", "4242"]);
  assert.deepEqual(taskpolicyArgs("performance", 4242), ["-B", "-p", "4242"]);
});
