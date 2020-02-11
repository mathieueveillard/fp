describe("Transducers", function() {
  it("should allow to compose reducers without transducer", function() {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const increment = i => i + 1;
    const isEven = i => i % 2 == 0;
    const sum = (i, j) => i + j;

    const actual = values
      .map(increment)
      .filter(isEven)
      .reduce(sum, 0);

    expect(actual).toEqual(30);
  });

  it("should allow to compose reducers with transducers", function() {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // fns
    const increment = i => i + 1;
    const isEven = i => i % 2 == 0;

    // Reducer
    const sum = (a, c) => a + c;

    // Transducers (here "reducer" stands for "nextReducer")
    const map = fn => reducer => (a, c) => reducer(a, fn(c));
    const filter = fn => reducer => (a, c) => (fn(c) ? reducer(a, c) : a);

    // Composition (reduceRight, not reduce, because transducers work with nextReducer)
    const pipe = (...fns) => x => fns.reduceRight((a, fn) => fn(a), x);

    const transducer = pipe(map(increment), filter(isEven));
    const actual = values.reduce(transducer(sum), 0);
    expect(actual).toEqual(30);
  });
});
