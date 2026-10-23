import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedUser } from "../src/allowlist.js";

test("string and number ids match", () => {
  assert.equal(isAllowedUser(111, "111"), true);
});

test("other users are rejected", () => {
  assert.equal(isAllowedUser(222, "111"), false);
});
