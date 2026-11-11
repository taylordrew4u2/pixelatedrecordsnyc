import assert from "node:assert/strict";
import test from "node:test";
import { confirmedBarMenu } from "../src/lib/drink-menu";
import { seedContent } from "../src/lib/seed";
import { validateContent } from "../src/lib/server/validation";

test("the supplied menu imports all 52 drink entries with prices, supplements, and available choices", () => {
  validateContent(seedContent);
  const items = confirmedBarMenu.categories.flatMap(
    (category) => category.items,
  );
  assert.equal(confirmedBarMenu.categories.length, 10);
  assert.equal(items.length, 52);
  assert.equal(new Set(items.map((item) => item.id)).size, 52);
  const item = (name: string) => items.find((entry) => entry.name === name)!;
  assert.equal(item("Gucci Lemonade").price, "$13");
  assert.equal(item("Margarita").description, "Flavored +$1");
  assert.equal(item("Espresso").description, "Double +$2");
  assert.equal(item("Sidecar").price, "$15");
  assert.equal(item("Drink Palestina").price, "$3");
  assert.match(item("Well spirit + mixer").description, /Red Bull Sugar-Free/);
  assert.match(
    confirmedBarMenu.categories.find((category) => category.id === "coffee")!
      .description,
    /Oat or almond milk \+\$1/,
  );
  assert.match(
    confirmedBarMenu.categories.find((category) => category.id === "coffee")!
      .description,
    /Syrups \+\$0.50/,
  );
  assert.ok(
    items.every((entry) => /^\$\d+$/.test(entry.price) && entry.available),
  );
});
