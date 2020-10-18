interface Getter<Raw, Wrapped> {
  (w: Wrapped): Raw;
}

interface Setter<Raw, Wrapped> {
  (r: Raw, w: Wrapped): Wrapped;
}

interface Lens<R, W> {
  get: Getter<R, W>;
  set: Setter<R, W>;
}

function lens<R, W>(get: Getter<R, W>, set: Setter<R, W>): Lens<R, W> {
  return {
    get,
    set
  };
}

function compose<U, V, W>(lens2: Lens<V, W>, lens1: Lens<U, V>): Lens<U, W> {
  return {
    get: object => lens1.get(lens2.get(object)),
    set: (value, object) => lens2.set(lens1.set(value, lens2.get(object)), object)
  };
}

describe("Lenses", function() {
  type TemperatureInCelcius = number;
  type TemperatureInFahrenheit = number;
  type WindInMetersPerSecond = number;

  interface StandardWeather {
    cTemperature: TemperatureInCelcius;
    wind: WindInMetersPerSecond;
  }

  interface USWeather {
    fTemperature: TemperatureInFahrenheit;
    wind: WindInMetersPerSecond;
  }

  it("A lens should allow to extract data from state and backwards", function() {
    // GIVEN
    function getTemperature({ cTemperature }: StandardWeather): TemperatureInCelcius {
      return cTemperature;
    }

    function setTemperature(cTemperature: TemperatureInCelcius, weather: StandardWeather): StandardWeather {
      return {
        ...weather,
        cTemperature
      };
    }

    const temperatureLens: Lens<TemperatureInCelcius, StandardWeather> = lens(getTemperature, setTemperature);

    const weather: StandardWeather = {
      cTemperature: 17,
      wind: 0
    };

    // WHEN, THEN
    expect(temperatureLens.get(weather)).toEqual(17);
    expect(temperatureLens.set(18, weather)).toEqual({ cTemperature: 18, wind: 0 });
  });

  it("should allow to compose lenses", function() {
    // GIVEN
    function getTemperature({ cTemperature }: StandardWeather): TemperatureInCelcius {
      return cTemperature;
    }

    function setTemperature(cTemperature: TemperatureInCelcius, weather: StandardWeather): StandardWeather {
      return {
        ...weather,
        cTemperature
      };
    }

    const celciusTemperatureLens: Lens<TemperatureInCelcius, StandardWeather> = lens(getTemperature, setTemperature);

    // https://en.wikipedia.org/wiki/Fahrenheit

    function celciusToFahrenheit(cTemperature: TemperatureInCelcius): TemperatureInFahrenheit {
      return Math.round((cTemperature * 9) / 5 + 32);
    }

    function fahrenheitToCelcius(fTemperature: TemperatureInFahrenheit): TemperatureInCelcius {
      return Math.round(((fTemperature - 32) * 5) / 9);
    }

    const fahrenheitToCelciusLens: Lens<TemperatureInFahrenheit, TemperatureInCelcius> = lens(
      celciusToFahrenheit,
      fahrenheitToCelcius
    );

    const fahrenheitTemperatureLens: Lens<TemperatureInFahrenheit, StandardWeather> = compose(
      celciusTemperatureLens,
      fahrenheitToCelciusLens
    );

    const standardWeather: StandardWeather = {
      cTemperature: 0,
      wind: 0
    };

    // WHEN, THEN
    expect(fahrenheitTemperatureLens.get(standardWeather)).toEqual(32);
    expect(fahrenheitTemperatureLens.set(50, standardWeather)).toEqual({ cTemperature: 10, wind: 0 });
  });

  it("House of Cards", function() {
    type FirstName = string;
    type LastName = string;

    interface Name {
      firstName: FirstName;
      lastName: LastName;
    }

    type DateOfBirth = Date;

    interface Identity {
      name: Name;
      dateOfBirth: DateOfBirth;
    }

    const nameLens = lens<Name, Identity>(
      ({ name }) => name,
      (name, identity) => ({ ...identity, name })
    );

    const firstNameLens = lens<FirstName, Name>(
      ({ firstName }) => firstName,
      (firstName, name) => ({ ...name, firstName })
    );

    const firstNameFromIdentityLens = compose(nameLens, firstNameLens);

    const identity: Identity = {
      name: {
        firstName: "Francis",
        lastName: "Underwood"
      },
      dateOfBirth: new Date("November 5, 1959")
    };
    expect(firstNameFromIdentityLens.get(identity)).toEqual("Francis");
    expect(firstNameFromIdentityLens.set("Frank", identity)).toEqual({
      name: {
        firstName: "Frank",
        lastName: "Underwood"
      },
      dateOfBirth: new Date("November 5, 1959")
    });
  });
});
