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
  windowVisible: true,
};

test("on mains power, cool and in sight, the simulation has the performance cores", () => {
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

test("battery, Low Power Mode, heat or a hidden window move it to the efficiency cores", () => {
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
  assert.deepEqual(decidePowerMode({ ...cool, windowVisible: false }), {
    mode: "efficiency",
    reason: "hidden",
  });
});

test("the reason shown is the most telling one", () => {
  const everything: PowerInputs = {
    onBattery: true,
    lowPowerMode: true,
    thermalState: "critical",
    windowVisible: false,
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
