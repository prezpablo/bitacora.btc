/** Piezas instaladas, con foto. */
export type StatuePin = {
  id: "budapest" | "el-zonte";
  lat: number;
  lon: number;
  year: number;
  img: string;
  nameKey: "statueBudapestName" | "statueZonteName";
  whereKey: "statueBudapestWhere" | "statueZonteWhere";
  aboutKey: "statueBudapestAbout" | "statueZonteAbout";
  creditKey: "statueBudapestCredit" | "statueZonteCredit";
};

export const STATUES: StatuePin[] = [
  {
    id: "budapest",
    lat: 47.560722,
    lon: 19.054375,
    year: 2021,
    img: "/statues/budapest.jpg",
    nameKey: "statueBudapestName",
    whereKey: "statueBudapestWhere",
    aboutKey: "statueBudapestAbout",
    creditKey: "statueBudapestCredit",
  },
  {
    id: "el-zonte",
    lat: 13.4942,
    lon: -89.4405,
    year: 2025,
    img: "/statues/el-zonte.jpg",
    nameKey: "statueZonteName",
    whereKey: "statueZonteWhere",
    aboutKey: "statueZonteAbout",
    creditKey: "statueZonteCredit",
  },
];
