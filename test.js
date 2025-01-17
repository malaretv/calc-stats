const test = require("flug");
const flatIter = require("flat-iter");
const calcStats = require("./calc-stats");

const keys = obj => Object.keys(obj).sort();

const nums = [];

const histogram = {};
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
  mean: "66.333333333333333",
  median: "70",
  mode: "99",
  modes: ["99"],
  range: "98",
  sum: "328350",
  std: "23.44970978261541",
  valid: "4950",
  variance: "549.888888888888889",
  uniques: Array.from(new Set(nums.map(n => n.toString())))
};

test("array", ({ eq }) => {
  const results = calcStats(nums);
  eq(results, expectation);
});

test("empty array", ({ eq }) => {
  calcStats([]);
});

test("async array", async ({ eq }) => {
  const results = await calcStats(
    nums.map(n => Promise.resolve(n)),
    { async: true }
  );
  eq(results, expectation);
});

test("precise", ({ eq }) => {
  const results = calcStats(nums, { calcProduct: false, precise: true, precise_max_decimal_digits: 15 });
  eq(results, precise_expectation);
});

test("iterator", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator]());
  eq(results, expectation);
});

test("no data", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator](), {
    calcHistogram: false,
    calcUniques: false,
    noData: 99
  });
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

test("calcHistogram off", ({ eq }) => {
  const results = calcStats(nums[Symbol.iterator](), { calcHistogram: false, calcUniques: false });
  eq(results, {
    count: 4950,
    invalid: 0,
    median: 70,
    min: 1,
    max: 99,
    sum: 328350,
    mean: 66.33333333333333,
    modes: [99],
    mode: 99,
    product: Infinity,
    range: 98,
    std: 23.44970978261541,
    valid: 4950,
    variance: 549.8888888888889
  });
});

test("calcHistogram off promise array", async ({ eq }) => {
  const data = nums.map(n => Promise.resolve(n))[Symbol.iterator]();
  const results = await calcStats(data, { async: true, calcHistogram: false, calcUniques: false });
  eq(results, {
    count: 4950,
    invalid: 0,
    median: 70,
    min: 1,
    max: 99,
    sum: 328350,
    mean: 66.33333333333333,
    modes: [99],
    mode: 99,
    product: Infinity,
    range: 98,
    std: 23.44970978261541,
    valid: 4950,
    variance: 549.8888888888889
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
    calcUniques: false,
    filter: ({ value }) => value > 45 && value < 55
  });
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
    calcUniques: false,
    filter: ({ index }) => index < 10
  });
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

test("nulls and nans", ({ eq }) => {
  const data = [61, null, null, null, null, Number("x"), null, null, null, null];
  const stats = calcStats(data);
  const expected = {
    count: 10,
    median: 61,
    min: 61,
    max: 61,
    mean: 61,
    histogram: { 61: { n: 61, ct: 1 } },
    invalid: 9,
    modes: [61],
    mode: 61,
    product: 61,
    range: 0,
    sum: 61,
    valid: 1,
    variance: 0,
    std: 0,
    uniques: [61]
  };
  eq(keys(stats), keys(expected));
  for (key in stats) {
    try {
      eq(stats[key], expected[key]);
    } catch (error) {
      console.error(key);
      throw error;
    }
  }
  eq(stats, expected);
});

test("stats param", ({ eq }) => {
  const stats = calcStats(nums, { stats: ["min", "max", "median", "product", "std"] });
  eq(stats, {
    min: 1,
    max: 99,
    median: 70,
    product: Infinity,
    std: 23.44970978261541
  });
});

test("calc just standard deviation", ({ eq }) => {
  const stats = calcStats(nums, { stats: ["std"] });
  eq(stats, {
    std: 23.44970978261541
  });
});

test("product", ({ eq }) => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const stats = calcStats(data, { stats: ["product"] });
  eq(stats, { product: 362880 });

  const precise_stats = calcStats(data, { precise: true, stats: ["product"] });
  eq(precise_stats, { product: "362880" });
});

test("chunked", ({ eq }) => {
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];
  const stats = calcStats(rows, { chunked: true, stats: ["min", "max"] });
  eq(stats, { min: 1, max: 9 });
});

test("cells map string", ({ eq }) => {
  const rows = [{ value: 1 }, { value: 2 }, { value: 3 }];
  const stats = calcStats(rows, { map: "value", stats: ["min", "max"] });
  eq(stats, { min: 1, max: 3 });
});

test("map function", ({ eq }) => {
  const rows = [{ value: { n: 1 } }, { value: { n: 2 } }, { value: { n: 3 } }];
  const stats = calcStats(rows, { map: it => it.value.n, stats: ["min", "max"] });
  eq(stats, { min: 1, max: 3 });
});

test("large", ({ eq }) => {
  const m = 5;
  const height = 3974 * m;
  const width = 7322 * m;
  const rows = [];
  for (let r = 0; r < height; r++) {
    const row = new Uint8Array(width);
    for (let c = 0; c < width; c++) {
      row[c] = Math.round(Math.random() * 255);
    }
    rows.push(row);
  }
  const stats = calcStats(rows, { chunked: true, stats: ["min", "max", "range"], timed: true });

  eq(stats, { min: 0, max: 255, range: 255 });
});
