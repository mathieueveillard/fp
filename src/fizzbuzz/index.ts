import * as R from "ramda";

function appendIfMultipleOf(multipleOf: number, stringToAppend: string, n: number, currentString: string): string {
  if (n % multipleOf === 0) {
    return currentString + stringToAppend;
  }
  return currentString;
}

export function fizzbuzz(n: number) {
  const append = R.curry(appendIfMultipleOf);
  return R.pipe(append(3)("Fizz")(n), append(5)("Buzz")(n))("");
}
