// Dev-only bank validation: bun scripts/check-bank.ts
import { getBank, bankStats, filterQuestions } from "../src/data/qbank";

const s = bankStats();
console.log("TOTAL:", s.total, "| hand:", s.hand, "| gen:", s.gen);
console.log("byCourse:", s.byCourse);
console.log("byDiff:", s.byDiff);

const bank = getBank();
let bad = 0;
for (const q of bank) {
  if (q.choices.length !== 4) { console.log("BAD choices", q.id); bad++; }
  if (q.correct < 0 || q.correct > 3) { console.log("BAD correct", q.id); bad++; }
  if (!q.explanation || q.explanation.length < 20) { console.log("BAD explanation", q.id); bad++; }
  if (q.source === "gen" && q.prompt.length < 30) { console.log("BAD prompt", q.id); bad++; }
}
console.log("bad:", bad);

const kin = filterQuestions({ course: "p1", topic: "Kinematics" });
const prompts = new Set(kin.map((q) => q.prompt));
console.log("Kinematics questions:", kin.length, "unique prompts:", prompts.size);

const rc = filterQuestions({ course: "cem", topic: "RC Circuits", difficulty: "ap" });
console.log("CEM RC ap:", rc.length, rc.map((q) => q.id).join(", "));
