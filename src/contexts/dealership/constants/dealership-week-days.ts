export interface DealershipWeekDay {
  id: number;
  name: string;
  short_name: string;
}

export const DEALERSHIP_WEEK_DAYS: DealershipWeekDay[] = [
  {
    id: 1,
    name: "Lunes",
    short_name: "L",
  },
  {
    id: 2,
    name: "Martes",
    short_name: "M",
  },
  {
    id: 3,
    name: "Miércoles",
    short_name: "X",
  },
  {
    id: 4,
    name: "Jueves",
    short_name: "J",
  },
  {
    id: 5,
    name: "Viernes",
    short_name: "V",
  },
  {
    id: 6,
    name: "Sábado",
    short_name: "S",
  },
  {
    id: 7,
    name: "Domingo",
    short_name: "D",
  },
];
