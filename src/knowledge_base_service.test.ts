import assert from "node:assert/strict";
import test from "node:test";
import { chooseAnswerMode } from "./knowledge_base_service.ts";

test("routes each nonprofit audience to its concrete operating decision", () => {
  assert.equal(chooseAnswerMode("donor"), "receipt");
  assert.equal(chooseAnswerMode("volunteer"), "reminder");
  assert.equal(chooseAnswerMode("campaign"), "report");
});
