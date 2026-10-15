/**
 * Piezas instaladas, con foto.
 * La foto entra sin el lugar: se quita el fondo y se pone naranja #F7931A,
 * cuadrada, como Budapest y El Zonte. Esa es la regla de cada monumento.
 */
export type StatuePin = {
  id: "budapest" | "el-zonte" | "vienna";
  lat: number;
  lon: number;
  year: number;
  img: string;
  nameKey: "statueBudapestName" | "statueZonteName" | "statueViennaName";
  whereKey: "statueBudapestWhere" | "statueZonteWhere" | "statueViennaWhere";
  aboutKey: "statueBudapestAbout" | "statueZonteAbout" | "statueViennaAbout";
  creditKey: "statueBudapestCredit" | "statueZonteCredit" | "statueViennaCredit";
};

/** Halo dorado. El anillo naranja de comercios y comunidades no lo usa. */
export function statueGlow(px: number) {
  const blur = Math.max(6, Math.round(px * 0.5));
  const reach = Math.max(3, Math.round(px * 0.35));
  return {
    pad: blur + reach,
    shadow: `0 0 0 2px #ffe08a, 0 0 ${blur}px ${reach}px rgba(255,188,40,0.92)`,
  };
}

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
  {
    id: "vienna",
    lat: 48.21344,
    lon: 16.41383,
    year: 2026,
    img: "/statues/vienna.jpg",
    nameKey: "statueViennaName",
    whereKey: "statueViennaWhere",
    aboutKey: "statueViennaAbout",
    creditKey: "statueViennaCredit",
  },
];
