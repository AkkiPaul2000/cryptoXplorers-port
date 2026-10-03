import { enqueue } from "./Sparkline";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("sparkline requests run four at a time, in row order", async () => {
  const started = [];
  const settle = [];
  [0, 1, 2, 3, 4, 5].forEach((row) =>
    enqueue(
      () =>
        new Promise((resolve, reject) => {
          started.push(row);
          settle[row] = { resolve, reject };
        })
    ).catch(() => {})
  );
  expect(started).toEqual([0, 1, 2, 3]);

  settle[2].resolve();
  await tick();
  expect(started).toEqual([0, 1, 2, 3, 4]);

  settle[0].reject(new Error("aborted")); // a row that unmounted still frees its slot
  await tick();
  expect(started).toEqual([0, 1, 2, 3, 4, 5]);
});
