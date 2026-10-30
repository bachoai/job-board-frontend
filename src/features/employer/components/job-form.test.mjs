import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyForm, jobPayload, today, validateJob } from "./job-form.ts";
const valid = { ...emptyForm, companyId: "4", title: "Backend Developer" };
test("requires title/company and rejects unknown enums", () => {
  assert.ok(validateJob(emptyForm).companyId);
  assert.ok(validateJob(emptyForm).title);
  assert.ok(validateJob({ ...valid, title: " ".repeat(4) }).title);
  assert.ok(validateJob({ ...valid, title: "a".repeat(151) }).title);
  assert.ok(validateJob({ ...valid, jobType: "remote" }).jobType);
  assert.ok(validateJob({ ...valid, level: "lead" }).level);
});
test("salary boundaries and range ordering", () => {
  for (const value of ["-1", "1.5", "2147483648"])
    assert.ok(validateJob({ ...valid, salaryMin: value }).salaryMin);
  assert.ok(
    validateJob({ ...valid, salaryMin: "20", salaryMax: "10" }).salaryMax,
  );
  assert.deepEqual(
    validateJob({ ...valid, salaryMin: "0", salaryMax: "0" }),
    {},
  );
});
test("deadline accepts today and rejects past and invalid calendar dates", () => {
  assert.deepEqual(validateJob({ ...valid, deadline: today() }), {});
  assert.ok(validateJob({ ...valid, deadline: "2000-01-01" }).deadline);
  assert.ok(validateJob({ ...valid, deadline: "2099-02-31" }).deadline);
});
test("payload omits blank optional fields and preserves numeric zero", () => {
  assert.deepEqual(
    jobPayload({ ...valid, title: "  Developer  ", salaryMin: "0" }),
    {
      companyId: 4,
      title: "Developer",
      jobType: "full_time",
      currency: "VND",
      salaryMin: 0,
    },
  );
});

test("editing preserves an unchanged expired deadline but rejects a newly chosen past date", () => {
  assert.deepEqual(
    validateJob({ ...valid, deadline: "2000-01-01" }, "2000-01-01"),
    {},
  );
  assert.ok(
    validateJob({ ...valid, deadline: "2000-01-02" }, "2000-01-01").deadline,
  );
});
