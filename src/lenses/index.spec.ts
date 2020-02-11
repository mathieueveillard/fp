function lens(getter, setter) {
  return {
    getter,
    setter
  };
}

function view(lens, object) {
  return lens.getter(object);
}

function set(lens, value, object) {
  return lens.setter(value, object);
}

function compose(lens1, lens2) {
  return {
    getter: object => view(lens2, view(lens1, object)),
    setter: (value, object) => set(lens1, set(lens2, value, view(lens2, object)), object) // Here is the trick!
  };
}

describe("Lenses", function() {
  it("A lens should allow to extract data from state and backwards", function() {
    // GIVEN
    const weather = {
      temperature: 17,
      wind: 0
    };

    function getTemperature({ temperature }) {
      return temperature;
    }

    function setTemperature(temperature, object) {
      return {
        ...object,
        temperature
      };
    }

    const temperatureLens = lens(getTemperature, setTemperature);

    // WHEN, THEN
    const temperature = view(temperatureLens, weather);
    expect(temperature).toEqual(17);

    // WHEN, THEN
    const updatedWeather = set(temperatureLens, 18, weather);
    expect(updatedWeather).toEqual({ temperature: 18, wind: 0 });
  });

  it("should allow to compose lenses", function() {
    // GIVEN
    const weather = {
      temperatureInC: 0,
      wind: 0
    };

    function getTemperature({ temperatureInC }) {
      return temperatureInC;
    }

    function setTemperature(temperatureInC, object) {
      return {
        ...object,
        temperatureInC
      };
    }

    function cToF(temperatureInCelsius) {
      return Math.round((temperatureInCelsius * 9) / 5 + 32);
    }

    function fToC(temperatureInFahrenheit) {
      return Math.round(((temperatureInFahrenheit - 32) * 5) / 9);
    }

    const fahrenheitTemperatureLens = compose(lens(getTemperature, setTemperature), lens(cToF, fToC));

    // WHEN, THEN
    const temperatureInF = view(fahrenheitTemperatureLens, weather);
    expect(temperatureInF).toEqual(32);

    // WHEN, THEN
    const updatedWeather = set(fahrenheitTemperatureLens, 50, weather);
    expect(temperatureInF).toEqual({ temperatureInC: 10, wind: 0 });
  });
});
