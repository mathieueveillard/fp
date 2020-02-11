function appendIfMultipleOf(multiple: number, stringToAppend: string, n: number) {
  return function(currentString: string): string {
    if (n % multiple === 0) {
      return currentString + stringToAppend;
    }
    return currentString;
  };
}

export function fizzbuzz(n: number) {
  const appendFizzIfMultipleOf3 = appendIfMultipleOf(3, "Fizz", n);
  const appendBuzzIfMultipleOf5 = appendIfMultipleOf(5, "Buzz", n);
  return appendBuzzIfMultipleOf5(appendFizzIfMultipleOf3(""));
}
