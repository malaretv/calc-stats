import test from "flug";
import calcStats from "./calc-stats";

const nums: number[] = [];

const histogram: { [key: string]: { n: number; ct: number } } = {};
for (let i = 1; i < 100; i++) {
  for (let n = 0; n < i; n++) {
    nums.push(i);
  }
  histogram[i] = { n: i, ct: i };
}

const expectation = {
  count: 4950,
  histogram,
  invalid: 0,
  min: 1,
  max: 99,
  mean: 66.33333333333333,
  median: 70,
  mode: 99,
  modes: [99],
  product: Infinity,
  range: 98,
  sum: 328350,
  std: 23.44970978261541,
  valid: 4950,
  variance: 549.8888888888889,
  uniques: Array.from(new Set(nums))
};

const precise_expectation = {
  count: "4950",
  histogram: Object.fromEntries(
    Object.values(histogram).map(({ n, ct }) => [n, { n: n.toString(), ct: ct.toString() }])
  ),
  invalid: "0",
  min: "1",
  max: "99",
  mean: "66.3333333333",
  median: "70",
  mode: "99",
  modes: ["99"],
  range: "98",
  sum: "328350",
  std: "23.44970978261541",
  valid: "4950",
  variance: "549.88888888888888888889",
  uniques: Array.from(new Set(nums.map(n => n.toString())))
};

test("array", ({ eq }) => {
  const results = calcStats(nums);
  eq(results, expectation);
});

test("async array", async ({ eq }) => {
  const results = await calcStats(
    nums.map(n => Promise.resolve(n)),
    { async: true }
  );
  eq(results, expectation);
});

test("precise", ({ eq }) => {
  const inpt = nums.slice(5).map(n => 1 / n);
  console.log("inpt:", inpt);
  const results = calcStats(inpt, { precise: true, precise_max_decimal_digits: 50, stats: ["product"] });
  // eq(results, { product: _ });
});

test("iterator", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator]());
  eq(results, expectation);
});

test("no data", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator](), { noData: 99 });
  results.count;
  results.sum;
  delete results.histogram;
  delete results.uniques;
  eq(results, {
    count: 4950,
    invalid: 99,
    median: 70,
    min: 1,
    max: 98,
    sum: 318549,
    mean: 65.66666666666667,
    modes: [98],
    mode: 98,
    product: Infinity,
    range: 97,
    std: 23.213980461973534,
    valid: 4851,
    variance: 538.8888888888889
  });
});

test("median no data", async ({ eq }) => {
  const data = new Array(1e5).fill(-99).concat(new Array(1e2).fill(0)).concat(new Array(1e2).fill(1));
  const results = await calcStats(data, { noData: -99 });
  eq(results, {
    count: 100200,
    invalid: 100000,
    median: 0.5,
    min: 0,
    max: 1,
    sum: 100,
    mean: 0.5,
    histogram: { 0: { n: 0, ct: 100 }, 1: { n: 1, ct: 100 } },
    modes: [0, 1],
    mode: 0.5,
    product: 0,
    range: 1,
    std: 0.5,
    valid: 200,
    variance: 0.25,
    uniques: [0, 1]
  });
});

test("iterator with filter by value", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator](), {
    filter: ({ value }: { value: number }) => value > 45 && value < 55
  });
  delete results.uniques;
  eq(results, {
    count: 4950,
    invalid: 4500,
    median: 50,
    min: 46,
    max: 54,
    mean: 50.13333333333333,
    histogram: {
      46: { n: 46, ct: 46 },
      47: { n: 47, ct: 47 },
      48: { n: 48, ct: 48 },
      49: { n: 49, ct: 49 },
      50: { n: 50, ct: 50 },
      51: { n: 51, ct: 51 },
      52: { n: 52, ct: 52 },
      53: { n: 53, ct: 53 },
      54: { n: 54, ct: 54 }
    },
    modes: [54],
    mode: 54,
    product: Infinity,
    range: 8,
    sum: 22560,
    std: 2.578543947441829,
    valid: 450,
    variance: 6.648888888888889
  });
});

test("iterator with filter by index", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator](), {
    filter: ({ index }: { index: number }) => index < 10
  });
  delete results.uniques;
  eq(results, {
    count: 4950,
    median: 3,
    min: 1,
    max: 4,
    sum: 26,
    mean: 2.888888888888889,
    histogram: {
      1: { n: 1, ct: 1 },
      2: { n: 2, ct: 2 },
      3: { n: 3, ct: 3 },
      4: { n: 4, ct: 3 }
    },
    invalid: 4941,
    modes: [3, 4],
    mode: 3.5,
    product: 6912,
    range: 3,
    std: 0.9938079899999066,
    valid: 9,
    variance: 0.9876543209876544
  });
});

test("calc one", ({ eq }) => {
  const stats = calcStats(nums, { stats: ["std"] });
  stats.median + 1;
  stats.std + 1;
  eq(stats, {
    std: 23.44970978261541
  });
});

test("calc one precisely", ({ eq }) => {
  const stats = calcStats(nums, { stats: ["std"] });
  stats.median + 1;
  stats.std + 1;
  eq(stats, {
    std: 23.44970978261541
  });
});

test("calc two", ({ eq }) => {
  const stats = ["median", "std"] as const;
  const result = calcStats(nums, { stats });
  result.count + 1;
  result.median + 1;
  result.std + 1;
  eq(result, {
    median: 70,
    std: 23.44970978261541
  });
});

test("stats param", ({ eq }) => {
  const stats = calcStats(nums, { stats: ["min", "max", "median", "std"] });
  stats.count + 1;
  stats.median + 1;
  stats.min + 1;
  eq(stats, {
    min: 1,
    max: 99,
    median: 70,
    std: 23.44970978261541
  });
});

test("noData", ({ eq }) => {
  eq(calcStats(nums, { noData: 1, stats: ["valid", "invalid"] }), { valid: 4949, invalid: 1 });
  eq(calcStats(nums, { noData: [], stats: ["valid", "invalid"] }), { valid: 4950, invalid: 0 });
  eq(calcStats(nums, { noData: [13], stats: ["valid", "invalid"] }), { valid: 4937, invalid: 13 });
  eq(calcStats(nums, { noData: [1, 13], stats: ["valid", "invalid"] }), { valid: 4936, invalid: 14 });
});
