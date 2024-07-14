import { DataProvider } from "./data/data-provider";
export enum CalculationType {
  BasicPath = "BasicPath",
  ShortestPath = "ShortestPath",
  MostEfficientPath = "MostEfficientPath",
}

export type CalculatorOptions = {
  type: CalculationType;
};

const VALIDATE_INPUT = true;

export type Package = { name: string; destination: string; weight: number };
export type Path = {
  from: string;
  to: string;
  distance: number;
};

type TransitionCalculator = {
  calculate: (from: string, to: string, packages: Package[]) => number;
  reduce: (current: number, prev: number) => number;
  shouldContinueBranch: (currentValue: number, path: string[]) => boolean;
  onNewSolution: (solution: { path: string[]; value: number }) => void;
};

function createDistanceGraph(dataProvider: DataProvider) {
  const possibleTransitions = dataProvider.fetchPaths();

  const pathMap: Map<string, Map<string, number>> = new Map();

  // can make this part more complex
  for (let i = 0; i < possibleTransitions.length; i++) {
    const [from, to, csvDistance] = possibleTransitions[i].split(",");
    const distance = Number(csvDistance);

    if (pathMap.has(from)) {
      pathMap.get(from)?.set(to, distance);
    } else {
      pathMap.set(from, new Map([[to, distance]]));
    }

    if (pathMap.has(to)) {
      pathMap.get(to)?.set(from, distance);
    } else {
      pathMap.set(to, new Map([[from, distance]]));
    }
  }

  if (!VALIDATE_INPUT) return pathMap;

  const townsFromPath = [...new Set([...pathMap.keys()])];
  const [office, csvCapacity] = dataProvider.settings().split(",");
  const capacity = Number(csvCapacity);

  if (!townsFromPath.find((el) => el === office)) {
    throw new Error("Office is not among the paths");
  }

  const townsFromPackages = [
    ...new Set([
      ...Object.values(getPackages(dataProvider))
        .reduce((acc, curr) => [...acc, ...curr], [])
        .map((pack) => {
          if (pack.weight > capacity) {
            throw new Error(
              "Weight more than capacity for " + JSON.stringify(pack)
            );
          }
          return pack.destination;
        })
        .concat(Object.keys(getPackages(dataProvider))),
    ]),
  ];

  townsFromPackages.forEach((town) => {
    if (!townsFromPath.find((val) => val === town)) {
      throw new Error(
        "Package destination or start is not in paths for " + town
      );
    }
  });

  // not required for the solution, but used to validate inputs
  //this one will check existence of all paths and are they possible
  for (let f = 0; f < townsFromPath.length - 2; f++) {
    for (let s = f + 1; s < townsFromPath.length - 1; s++) {
      for (let t = s + 1; t < townsFromPath.length; t++) {
        const fT = townsFromPath[f];
        const sT = townsFromPath[s];
        const tT = townsFromPath[t];
        const fTos = pathMap.get(fT)!.get(sT)!;
        const fTot = pathMap.get(fT)!.get(tT)!;
        const sTot = pathMap.get(sT)!.get(tT)!;
        if (!(fTos + fTot + sTot)) {
          throw new Error("One of path does not exist");
        }
        const sums = [
          fTos + fTot - sTot,
          fTos + sTot - fTot,
          sTot + fTot - fTos,
        ];
        if (sums.find((val) => val < 0)) {
          throw new Error(
            "Error in distances between " + fT + sT + tT + JSON.stringify(sums)
          );
        }
      }
    }
  }

  return pathMap;
}

function getPackages(dataProvider: DataProvider): Record<string, Package[]> {
  const packages: Record<string, Package[]> = dataProvider
    .fetchPackages()
    .reduce((aggregate: Record<string, Package[]>, csvPackage) => {
      const [from, name, destination, csvWeight] = csvPackage.split(",");
      const pkg: Package = { destination, name, weight: Number(csvWeight) };

      aggregate[from] = aggregate[from] ? [...aggregate[from], pkg] : [pkg];

      return aggregate;
    }, {});

  return packages;
}

function generateAllPaths(
  dataProvider: DataProvider,
  transitionCalculator: TransitionCalculator
) {
  const packages = getPackages(dataProvider);

  if (Object.keys(packages).length === 0) {
    return;
  }

  const pathMap = createDistanceGraph(dataProvider);

  const [_, csvCapacity] = dataProvider.settings().split(",");
  const capacity = Number(csvCapacity);

  const towns = [...pathMap.keys()];

  type PathInformation = {
    path: string[];
    cargo: Package[];
    packages: Record<string, Package[]>;
    valueSoFar: number;
  };

  towns.forEach((startPoint) => {
    let potentialPaths: PathInformation[] = [
      {
        path: [startPoint],
        cargo: [],
        packages: { ...packages },
        valueSoFar: 0,
      },
    ];

    for (let i = 0; i < potentialPaths.length; i++) {
      i--;

      const [{ path, cargo, packages, valueSoFar }] = potentialPaths.splice(
        i,
        1
      );

      const currentOffice = path[path.length - 1];
      const cargoAfterOffload = cargo.filter(
        (p) => p.destination !== currentOffice
      );
      const { [currentOffice]: packagesToLoad, ...remainingPackages } =
        packages;
      const cargoAfterLoad = (packagesToLoad || []).concat(cargoAfterOffload);
      const currentWeight = cargoAfterLoad.reduce(
        (sum, p) => p.weight + sum,
        0
      );

      if (currentWeight > capacity) {
        continue;
      }

      let uniqueDestinations = [
        ...new Set(
          cargoAfterLoad
            .map((p) => p.destination)
            .concat(Object.keys(packages))
            .filter((dest) => dest != currentOffice)
        ),
      ];

      if (uniqueDestinations.length == 0) {
        let solutionValue = valueSoFar;
        let solutionPath = [...path];

        if (path[path.length - 1] !== startPoint) {
          const stepValue = transitionCalculator.calculate(
            currentOffice,
            startPoint,
            cargoAfterLoad || []
          );

          solutionValue = transitionCalculator.reduce(stepValue, solutionValue);

          solutionPath = [...path, startPoint];
        }

        transitionCalculator.onNewSolution({
          value: solutionValue,
          path: solutionPath,
        });

        continue;
      }

      for (let j = 0; j < uniqueDestinations.length; j++) {
        const destination = uniqueDestinations[j];

        const valueOnThisStep = transitionCalculator.calculate(
          currentOffice,
          destination,
          cargoAfterLoad
        );
        const combinedValue = transitionCalculator.reduce(
          valueOnThisStep,
          valueSoFar
        );
        const shouldContinue = transitionCalculator.shouldContinueBranch(
          combinedValue,
          [...path, destination]
        );

        if (!shouldContinue) {
          continue;
        }

        potentialPaths.push({
          path: [...path, destination],
          cargo: cargoAfterLoad,
          packages: remainingPackages,
          valueSoFar: combinedValue,
        });
      }
    }
  });
}

// Основи на маршрутизатора
export function calculatePath(dataProvider: DataProvider): string[] {
  const [office] = dataProvider.settings().split(",");
  let solution: string[] | undefined = undefined;

  const basicPathCalculator: TransitionCalculator = {
    calculate: () => 1,
    reduce: (a, b) => a + b,
    shouldContinueBranch: (val, path) =>
      val < (solution?.length || Number.MAX_VALUE) && path[0] === office,
    onNewSolution: ({ path }) => {
      if (!solution) {
        solution = path;

        return;
      }

      if (path[0] === office && path.length < solution.length) {
        solution = path;
      }
    },
  };

  generateAllPaths(dataProvider, basicPathCalculator);

  return solution || [];
}

// Най-кратък маршрут
export function calculateShortestPath(dataProvider: DataProvider) {
  const map = createDistanceGraph(dataProvider);

  let solution: { path: string[]; distance: number } | undefined = undefined;

  const shortestPathCalculator: TransitionCalculator = {
    calculate: (from, to) => map!.get(from)!.get(to)!,
    reduce: (a, b) => a + b,
    shouldContinueBranch: (value) =>
      value < (solution?.distance ?? Number.MAX_VALUE),
    onNewSolution: ({ path, value }) => {
      if (!solution) {
        solution = { path, distance: value };

        return;
      }

      if (solution.distance > value) {
        solution = { path, distance: value };
      }
    },
  };

  generateAllPaths(dataProvider, shortestPathCalculator);

  return solution || { path: [], distance: 0 };
}

// Най-ефикасен маршрут
export function calculateMostEfficientPath(dataProvider: DataProvider): {
  path: string[];
  fuel: number;
} {
  const map = createDistanceGraph(dataProvider);

  let solution: { path: string[]; fuel: number } | undefined = undefined;

  const mostEfficientCalculator: TransitionCalculator = {
    calculate: (from, to, packages) =>
      Math.round(
        ((map!.get(from)!.get(to)! *
          (10 + packages.reduce((prev, curr) => prev + curr.weight, 0) / 100)) /
          100) *
          10000
      ) / 10000,
    reduce: (a, b) => Math.round((a + b) * 10000) / 10000,
    shouldContinueBranch: (value) => {
      return value < (solution?.fuel ?? Number.MAX_VALUE);
    },
    onNewSolution: ({ path, value }) => {
      if (!solution) {
        solution = { path, fuel: value };

        return;
      }

      if (solution.fuel > value) {
        solution = { path, fuel: value };
      }
    },
  };

  generateAllPaths(dataProvider, mostEfficientCalculator);

  return solution || { path: [], fuel: 0 };
}

export function main(
  { type }: CalculatorOptions,
  dataProvider: DataProvider
): string {
  // от тук започва вашето решение
  switch (type) {
    case CalculationType.BasicPath: {
      return calculatePath(dataProvider).join(",");
    }
    case CalculationType.ShortestPath: {
      const { path, distance } = calculateShortestPath(dataProvider);

      if (path.length === 0) return "";

      return `${path.join(",")},${distance}`;
    }
    case CalculationType.MostEfficientPath: {
      const { path, fuel } = calculateMostEfficientPath(dataProvider);

      if (path.length === 0) return "";

      return `${path.join(",")},${fuel.toFixed(4)}`;
    }
  }
}
