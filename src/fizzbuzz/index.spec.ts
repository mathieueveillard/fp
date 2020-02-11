import { fizzbuzz } from ".";

describe("If n is a multiple of 3, return 'Fizz'", () => {
  it("should return 'Fizz' for n = 3", () => {
    expect(fizzbuzz(3)).toEqual("Fizz");
  });
});

describe("If n is a multiple of 5, return 'Buzz'", () => {
  it("should return 'Buzz' for n = 5", () => {
    expect(fizzbuzz(5)).toEqual("Buzz");
  });

  it("should return 'Buzz' for n = 10", () => {
    expect(fizzbuzz(10)).toEqual("Buzz");
  });
});

describe("If n is a multiple of 3 and 5, return 'FizzBuzz'", () => {
  it("should return 'FizzBuzz' for n = 3 * 5", () => {
    expect(fizzbuzz(3 * 5)).toEqual("FizzBuzz");
  });

  it("should return 'FizzBuzz' for n = 3 * 5 * 2", () => {
    expect(fizzbuzz(3 * 5 * 2)).toEqual("FizzBuzz");
  });
});
