import { CalculationType, main } from "../index";
import { DataProvider } from "../data/data-provider";

const TEST_TIMEOUT = Number(process.env.SINGLE_TEST_TIMEOUT_IN_MILLIS ?? 2000);

describe("Основи на маршрутизатора", () => {
  let dataProvider: DataProvider;

  beforeEach(() => {
    dataProvider = new DataProvider();
  });

  it(
    "starts and ends on the starting point if no packages",
    () => {
      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => []);

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = ["", "София"];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "follows the main scenario",
    () => {
      const path = main({ type: CalculationType.BasicPath }, dataProvider);
      const expectedPaths = [
        "София,Велико Търново,Пловдив,Велико Търново,София",
      ];

      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "uses only two cities",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => ["София,Енина,200"]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "София,PR_NAME3,Енина,250",
        "Енина,PR_NAME1,София,250",
      ]);

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = ["София,Енина,София"];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "has rewritten office and capacity",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "TownB,TownC,2",

        "TownA,TownC,2",
        "TownA,TownB,1",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownB,Product4,TownC,10",

        "TownA,PR_NAME3,TownC,11",
        "TownA,PR_NAME3,TownB,10",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownA,21");

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = ["TownA,TownB,TownC,TownA"];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "can not deliver immediately",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "TownB,TownC,2",

        "TownA,TownC,2",
        "TownA,TownB,1",

        "TownD,TownA,4",
        "TownD,TownB,4",
        "TownD,TownC,4",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownA,Product4,TownB,10",
        "TownA,PR_NAME3,TownC,10",

        "TownB,PR_NAME3,TownC,20",
        "TownC,PR_NAME3,TownD,1",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownA,21");

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = [
        "TownA,TownC,TownD,TownB,TownC,TownA",
        "TownA,TownC,TownB,TownC,TownD,TownA",
        "TownA,TownC,TownB,TownD,TownC,TownA",
      ];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "goes back and forth to the office",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "TownB,TownC,2",
        "TownA,TownC,2",
        "TownA,TownB,1",

        "TownD,TownA,4",
        "TownD,TownB,4",
        "TownD,TownC,4",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownA,Product4,TownB,10",
        "TownB,PR_NAME3,TownA,10",
        "TownC,PR_NAME3,TownA,10",
        "TownD,PR_NAME3,TownA,1",
        "TownA,PR_NAME3,TownD,1",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownA,11");

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = [
        "TownA,TownB,TownA,TownC,TownD,TownA",
        "TownA,TownB,TownA,TownD,TownC,TownA",
        "TownA,TownB,TownD,TownA,TownC,TownA",
        "TownA,TownD,TownB,TownA,TownC,TownA",
      ];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "operates in circular deliveries",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "TownB,TownC,2",
        "TownA,TownC,2",
        "TownA,TownB,1",

        "TownD,TownA,4",
        "TownD,TownB,4",
        "TownD,TownC,4",
        "TownD,TownE,4",
        "TownD,TownF,4",
        "TownF,TownE,8",

        "TownA,TownE,8",
        "TownB,TownE,8",
        "TownC,TownE,8",

        "TownA,TownF,8",
        "TownB,TownF,8",
        "TownC,TownF,8",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownA,Product4,TownB,1",
        "TownB,Product4,TownC,1",
        "TownB,Product4,TownA,1",
        "TownC,Product4,TownD,1",
        "TownC,Product4,TownA,1",
        "TownD,Product4,TownE,1",
        "TownD,Product4,TownA,1",
        "TownE,Product4,TownF,1",
        "TownE,Product4,TownA,1",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownA,11");

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = ["TownA,TownB,TownC,TownD,TownE,TownF,TownA"];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "ignores towns with no packages",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "TownB,TownC,2",
        "TownA,TownC,2",
        "TownA,TownB,1",

        "TownD,TownA,4",
        "TownD,TownB,4",
        "TownD,TownC,4",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownA,Product4,TownB,10",
        "TownB,PR_NAME3,TownC,10",
        "TownC,PR_NAME3,TownA,10",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownA,10");

      const path = main({ type: CalculationType.BasicPath }, dataProvider);

      const expectedPaths = ["TownA,TownB,TownC,TownA"];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );
});

describe("Най-кратък маршрут", () => {
  let dataProvider: DataProvider;

  beforeEach(() => {
    dataProvider = new DataProvider();
  });

  it(
    "starts and ends on the starting point if no packages",
    () => {
      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => []);

      const path = main({ type: CalculationType.ShortestPath }, dataProvider);

      const expectedPaths = ["", "София,0"];
      expect(expectedPaths).toContainEqual(path);
    },
    TEST_TIMEOUT
  );

  it(
    "main scenario",
    () => {
      const pathAndDistance = main(
        { type: CalculationType.ShortestPath },
        dataProvider
      );

      const expectedPaths = [
        "София,Велико Търново,Пловдив,Велико Търново,София,864",
        "Пловдив,Велико Търново,София,Велико Търново,Пловдив,864",
        "Велико Търново,София,Велико Търново,Пловдив,Велико Търново,864",
      ];
      expect(expectedPaths).toContainEqual(pathAndDistance);
    },
    TEST_TIMEOUT
  );

  it(
    "finds path with extra city",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "София,Пловдив,146",
        "София,Велико Търново,219",
        "Пловдив,Велико Търново,213",
        "Пловдив,Стара Загора,104",
        "Велико Търново,Стара Загора,109",
        "София,Стара Загора,231",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "София,Фурна,Пловдив,100",
        "София,Хладилник,Велико Търново,100",
        "София,Куфар,Стара Загора,40",
        "Пловдив,Цимент,Велико Търново,200",
        "Велико Търново,Пакет химикалки,София,2",
      ]);

      const pathAndDistance = main(
        { type: CalculationType.ShortestPath },
        dataProvider
      );

      const expectedPaths = [
        "София,Велико Търново,Пловдив,Стара Загора,Велико Търново,София,864",
        "София,Велико Търново,Стара Загора,Пловдив,Велико Търново,София,864",
        "Пловдив,Велико Търново,София,Велико Търново,Стара Загора,Пловдив,864",
        "Велико Търново,София,Велико Търново,Пловдив,Стара Загора,Велико Търново,864",
        "Велико Търново,София,Велико Търново,Стара Загора,Пловдив,Велико Търново,864",
      ];

      expect(expectedPaths).toContainEqual(pathAndDistance);
    },
    TEST_TIMEOUT
  );

  it(
    "finds optimal path that does not deliver package immediately",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "София,Ивайловград,100",
        "Ивайловград,Пловдив,100",
        "Пловдив,София,100",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "Пловдив,PL_SOf_120,София,120",
        "Ивайловград,IVA_SOf_120,София,120",
      ]);

      const pathAndDistance = main(
        { type: CalculationType.ShortestPath },
        dataProvider
      );

      const expectedPaths = [
        "София,Пловдив,Ивайловград,София,300",
        "София,Ивайловград,Пловдив,София,300",
        "Ивайловград,Пловдив,София,Ивайловград,300",
        "Пловдив,Ивайловград,София,Пловдив,300",
      ];

      expect(expectedPaths).toContainEqual(pathAndDistance);
    },
    TEST_TIMEOUT
  );

  it(
    "finds only one solution",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() =>
        [
          //Circle part
          "TownA,TownB,2",
          "TownB,TownC,2",
          "TownC,TownD,2",
          "TownD,TownE,2",
          "TownE,TownF,2",
          "TownF,TownG,2",
          "TownG,TownH,2",
          // H in midle
          "TownA,TownH,4",
          "TownB,TownH,4",
          "TownC,TownH,4",
          "TownD,TownH,4",
          "TownE,TownH,4",
          "TownF,TownH,4",
          "TownG,TownH,4",
          //Between them

          "TownA,TownC,4",
          "TownA,TownD,6",
          "TownA,TownE,6",
          "TownA,TownF,4",
          "TownA,TownG,2",

          "TownB,TownD,4",
          "TownB,TownE,6",
          "TownB,TownF,6",
          "TownB,TownG,4",

          "TownC,TownE,4",
          "TownC,TownF,6",
          "TownC,TownG,4",

          "TownD,TownF,4",
          "TownD,TownG,6",

          "TownE,TownG,4",
        ].reverse()
      );

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() =>
        [
          //Circle delivery
          "TownA,PR_NAME3,TownB,500",
          "TownB,PR_NAME3,TownC,500",
          "TownC,PR_NAME3,TownD,500",
          "TownD,PR_NAME3,TownE,500",
          "TownE,PR_NAME3,TownF,500",
          "TownF,PR_NAME3,TownG,500",
          "TownG,PR_NAME3,TownH,500",
          //
          "TownA,PR_NAME2,TownH,500",
          "TownH,PR_NAME2,TownB,1",
        ].reverse()
      );

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownE,1001");

      const pathAndDistance = main(
        { type: CalculationType.ShortestPath },
        dataProvider
      );

      const expectedPaths = [
        "TownH,TownA,TownB,TownC,TownD,TownE,TownF,TownG,TownH,18",
      ];

      expect(expectedPaths).toContainEqual(pathAndDistance);
    },
    TEST_TIMEOUT
  );

  it(
    "Many cities, little amount of packages",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      const pathsDistances: string[] = [];
      for (let start = 1; start <= 25; start++) {
        for (let end = start + 1; end <= 26; end++) {
          const from = String.fromCharCode(64 + start);
          const to = String.fromCharCode(64 + end);
          pathsDistances.push(`Town${from},Town${to},${end - start}`);
        }
      }
      fetchPaths.mockImplementation(() => pathsDistances);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownC,PR_NAME5,TownA,50",
        "TownA,PR_NAME1,TownB,100",
        "TownA,PR_NAME2,TownB,100",
        "TownB,PR_NAME3,TownA,100",
        "TownC,PR_NAME4,TownB,50",
        "TownC,PR_NAME6,TownD,152",
        "TownY,PR_NAME7,TownA,41",
        "TownY,PR_NAME7,TownZ,27",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownE,1001");

      const pathAndDistance = main(
        { type: CalculationType.ShortestPath },
        dataProvider
      );

      const expectedPaths = [
        "TownA,TownC,TownY,TownZ,TownD,TownB,TownA,50",
        "TownA,TownC,TownD,TownY,TownZ,TownB,TownA,50",
        "TownA,TownB,TownC,TownD,TownY,TownZ,TownB,TownA,50",
        "TownA,TownB,TownC,TownY,TownZ,TownD,TownB,TownA,50",
        "TownB,TownC,TownD,TownY,TownZ,TownA,TownB,50",
        "TownB,TownC,TownY,TownZ,TownD,TownA,TownB,50",
        "TownB,TownC,TownD,TownY,TownZ,TownB,TownA,TownB,50",
        "TownB,TownC,TownY,TownZ,TownD,TownB,TownA,TownB,50",
        "TownC,TownD,TownY,TownZ,TownB,TownA,TownB,TownC,50",
        "TownC,TownY,TownZ,TownD,TownB,TownA,TownB,TownC,50",
        "TownD,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,50",
        "TownE,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownE,50",
        "TownF,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownF,50",
        "TownG,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownG,50",
        "TownH,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownH,50",
        "TownI,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownI,50",
        "TownJ,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownJ,50",
        "TownK,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownK,50",
        "TownL,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownL,50",
        "TownM,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownM,50",
        "TownN,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownN,50",
        "TownO,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownO,50",
        "TownP,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownP,50",
        "TownQ,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownQ,50",
        "TownR,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownR,50",
        "TownS,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownS,50",
        "TownT,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownT,50",
        "TownU,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownU,50",
        "TownV,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownV,50",
        "TownW,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownW,50",
        "TownX,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownX,50",
        "TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownY,50",
        "TownY,TownC,TownB,TownA,TownB,TownD,TownZ,TownY,50",
        "TownZ,TownY,TownC,TownB,TownA,TownB,TownD,TownZ,50",
      ];

      expect(expectedPaths).toContainEqual(pathAndDistance);
    },
    TEST_TIMEOUT
  );
});

describe("Най-ефикасен маршрут", () => {
  let dataProvider: DataProvider;

  beforeEach(() => {
    dataProvider = new DataProvider();
  });

  it(
    "follows the main scenario",
    () => {
      const pathAndFuel = main(
        { type: CalculationType.MostEfficientPath },
        dataProvider
      );

      const expectedPaths = [
        "Пловдив,Велико Търново,София,Велико Търново,Пловдив,97.2138",
        "Велико Търново,София,Велико Търново,Пловдив,Велико Търново,97.2138",
      ];

      expect(expectedPaths).toContainEqual(pathAndFuel);
    },
    TEST_TIMEOUT
  );

  it(
    "One of optimal solutions contains bus moving empty",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "Пловдив,София,103",
        "Пловдив,Велико Търново,101",
        "Пловдив,Стара Загора,101",
        "София,Стара Загора,202",
        "София,Велико Търново,203",
        "Стара Загора,Велико Търново,10",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "София,SOf_PL_200,Пловдив,200",
        "Велико Търново,TUR_SOf_130,София,130",
        "Велико Търново,TUr_ZAG_120,Стара Загора,120",
        "Стара Загора,ZAG_SOf_120,София,120",
      ]);

      const pathAndFuel = main(
        { type: CalculationType.MostEfficientPath },
        dataProvider
      );

      const expectedPaths = [
        "Пловдив,Велико Търново,Стара Загора,София,Пловдив,48.9600",
        "София,Пловдив,Велико Търново,Стара Загора,София,48.9600",
        "Велико Търново,Стара Загора,София,Пловдив,Велико Търново,48.9600",
      ];

      expect(expectedPaths).toContainEqual(pathAndFuel);
    },
    TEST_TIMEOUT
  );

  it(
    "Optimal path does not deliver package immediately",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "София,Ивайловград,100",
        "Ивайловград,Пловдив,100",
        "Пловдив,София,100",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "Пловдив,PL_SOf_120,София,120",
        "Ивайловград,IVA_SOf_120,София,120",
      ]);

      const pathAndFuel = main(
        { type: CalculationType.MostEfficientPath },
        dataProvider
      );

      const expectedPaths = [
        "София,Пловдив,Ивайловград,София,33.6000",
        "София,Ивайловград,Пловдив,София,33.6000",
        "Ивайловград,Пловдив,София,Ивайловград,33.6000",
        "Пловдив,Ивайловград,София,Пловдив,33.6000",
      ];

      expect(expectedPaths).toContainEqual(pathAndFuel);
    },
    TEST_TIMEOUT
  );

  it(
    "solutions for most efficient and smallest are different",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        "TownA,TownC,2",
        "TownA,TownB,1",
        "TownB,TownC,2",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownA,PR_NAME3,TownB,500",
        "TownB,PR_NAME1,TownA,500",
        "TownB,PR_NAME2,TownC,1",
        "TownA,PR_NAME4,TownC,1",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownA,502");

      const pathAndFuel = main(
        { type: CalculationType.MostEfficientPath },
        dataProvider
      );

      const expectedPaths = [
        "TownA,TownB,TownA,TownC,TownA,0.7007",
        "TownC,TownA,TownB,TownA,TownC,0.7007",
        "TownC,TownB,TownA,TownB,TownC,0.7007",
        "TownB,TownA,TownB,TownC,TownB,0.7007",
      ];

      expect(expectedPaths).toContainEqual(pathAndFuel);
    },
    TEST_TIMEOUT
  );

  it(
    "only one solution",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      fetchPaths.mockImplementation(() => [
        //Circle part
        "TownA,TownB,1",
        "TownB,TownC,1",
        "TownC,TownD,1",
        "TownD,TownE,1",
        "TownE,TownF,1",
        "TownF,TownG,1",
        "TownG,TownH,1",
        // H in midle
        "TownA,TownH,2",
        "TownB,TownH,2",
        "TownC,TownH,2",
        "TownD,TownH,2",
        "TownE,TownH,2",
        "TownF,TownH,2",
        "TownG,TownH,2",
        //Between them

        "TownA,TownC,2",
        "TownA,TownD,3",
        "TownA,TownE,3",
        "TownA,TownF,2",
        "TownA,TownG,1",

        "TownB,TownD,2",
        "TownB,TownE,3",
        "TownB,TownF,3",
        "TownB,TownG,2",

        "TownC,TownE,2",
        "TownC,TownF,3",
        "TownC,TownG,3",

        "TownD,TownF,2",
        "TownD,TownG,3",

        "TownE,TownG,2",
      ]);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        //Circle delivery
        "TownA,PR_NAME3,TownB,500",
        "TownB,PR_NAME3,TownC,500",
        "TownC,PR_NAME3,TownD,500",
        "TownD,PR_NAME3,TownE,500",
        "TownE,PR_NAME3,TownF,500",
        "TownF,PR_NAME3,TownG,500",
        "TownG,PR_NAME3,TownH,500",
        //
        "TownA,PR_NAME2,TownH,500",
        "TownH,PR_NAME2,TownB,1",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownE,1001");

      const pathAndFuel = main(
        { type: CalculationType.MostEfficientPath },
        dataProvider
      );

      const expectedPaths = [
        "TownH,TownA,TownB,TownC,TownD,TownE,TownF,TownG,TownH,1.8003",
      ];

      expect(expectedPaths).toContainEqual(pathAndFuel);
    },
    TEST_TIMEOUT
  );

  it(
    "Many cities, little amount of packages",
    () => {
      const fetchPaths = jest.spyOn(dataProvider, "fetchPaths");
      const pathsDistances: string[] = [];
      for (let start = 1; start <= 25; start++) {
        for (let end = start + 1; end <= 26; end++) {
          const from = String.fromCharCode(64 + start);
          const to = String.fromCharCode(64 + end);
          pathsDistances.push(`Town${from},Town${to},${end - start}`);
        }
      }
      fetchPaths.mockImplementation(() => pathsDistances);

      const fetchPackages = jest.spyOn(dataProvider, "fetchPackages");
      fetchPackages.mockImplementation(() => [
        "TownC,PR_NAME5,TownA,50",
        "TownA,PR_NAME1,TownB,100",
        "TownA,PR_NAME2,TownB,100",
        "TownB,PR_NAME3,TownA,100",
        "TownC,PR_NAME4,TownB,50",
        "TownC,PR_NAME6,TownD,152",
        "TownY,PR_NAME7,TownA,41",
        "TownY,PR_NAME7,TownZ,27",
      ]);

      const settings = jest.spyOn(dataProvider, "settings");
      settings.mockImplementation(() => "TownE,1001");

      const pathAndFuel = main(
        { type: CalculationType.MostEfficientPath },
        dataProvider
      );

      const expectedPaths = [
        "TownA,TownC,TownY,TownZ,TownD,TownB,TownA,5.2303",
        "TownA,TownC,TownD,TownY,TownZ,TownB,TownA,5.2303",
        "TownA,TownB,TownC,TownD,TownY,TownZ,TownB,TownA,5.2303",
        "TownA,TownB,TownC,TownY,TownZ,TownD,TownB,TownA,5.2303",
        "TownB,TownC,TownD,TownY,TownZ,TownA,TownB,5.2303",
        "TownB,TownC,TownY,TownZ,TownD,TownA,TownB,5.2303",
        "TownB,TownC,TownD,TownY,TownZ,TownB,TownA,TownB,5.2303",
        "TownB,TownC,TownY,TownZ,TownD,TownB,TownA,TownB,5.2303",
        "TownC,TownD,TownY,TownZ,TownB,TownA,TownB,TownC,5.2303",
        "TownC,TownY,TownZ,TownD,TownB,TownA,TownB,TownC,5.2303",
        "TownD,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,5.2303",
        "TownE,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownE,5.2303",
        "TownF,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownF,5.2303",
        "TownG,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownG,5.2303",
        "TownH,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownH,5.2303",
        "TownI,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownI,5.2303",
        "TownJ,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownJ,5.2303",
        "TownK,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownK,5.2303",
        "TownL,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownL,5.2303",
        "TownM,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownM,5.2303",
        "TownN,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownN,5.2303",
        "TownO,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownO,5.2303",
        "TownP,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownP,5.2303",
        "TownQ,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownQ,5.2303",
        "TownR,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownR,5.2303",
        "TownS,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownS,5.2303",
        "TownT,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownT,5.2303",
        "TownU,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownU,5.2303",
        "TownV,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownV,5.2303",
        "TownW,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownW,5.2303",
        "TownX,TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownX,5.2303",
        "TownY,TownZ,TownC,TownB,TownA,TownB,TownD,TownY,5.2303",
        "TownY,TownC,TownB,TownA,TownB,TownD,TownZ,TownY,5.2303",
        "TownZ,TownY,TownC,TownB,TownA,TownB,TownD,TownZ,5.2303",
      ];

      expect(expectedPaths).toContainEqual(pathAndFuel);
    },
    TEST_TIMEOUT
  );
});
