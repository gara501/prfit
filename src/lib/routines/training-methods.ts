export type TrainingMethod =
  | "traditional"
  | "max_intensity_1"
  | "max_intensity_2"
  | "repetitions_1"
  | "repetitions_2"
  | "repetitions_3"
  | "pyramid"
  | "pure_concentric"
  | "eccentric"
  | "max_isometric"
  | "total_isometric"
  | "static_dynamic"
  | "contrast"
  | "power_based"
  | "dynamic_effort"
  | "eccentric_concentric_explosive"
  | "plyometric"
  | "specific_loads"
  | "reactive_strength"
  | "strength_endurance"
  | "extensive_intervals"
  | "intermittent";

type TrainingMethodOption = {
  value: TrainingMethod;
  label: string;
  description: string;
};

type TrainingMethodGroup = {
  label: string;
  methods: readonly TrainingMethodOption[];
};

export const trainingMethodGroups = [
  {
    label: "Base",
    methods: [
      {
        value: "traditional",
        label: "Tradicional",
        description: "Serie convencional sin una técnica avanzada específica.",
      },
    ],
  },
  {
    label: "Fuerza máxima y repeticiones",
    methods: [
      {
        value: "max_intensity_1",
        label: "Intensidades máximas I",
        description:
          "Cargas máximas, normalmente 90–100 % de 1RM y 1–3 repeticiones.",
      },
      {
        value: "max_intensity_2",
        label: "Intensidades máximas II",
        description:
          "Cargas muy altas, normalmente 85–90 % de 1RM y 4–5 repeticiones.",
      },
      {
        value: "repetitions_1",
        label: "Repeticiones I",
        description: "Trabajo de fuerza con cargas altas y 5–7 repeticiones.",
      },
      {
        value: "repetitions_2",
        label: "Repeticiones II",
        description: "Trabajo de fuerza e hipertrofia con 6–12 repeticiones.",
      },
      {
        value: "repetitions_3",
        label: "Repeticiones III",
        description: "Carga moderada y ejecución rápida, sin llegar al fallo.",
      },
      {
        value: "pyramid",
        label: "Pirámide",
        description:
          "La carga aumenta entre series mientras disminuyen las repeticiones.",
      },
    ],
  },
  {
    label: "Acciones musculares",
    methods: [
      {
        value: "pure_concentric",
        label: "Concéntrico puro",
        description:
          "Cada repetición comienza sin contramovimiento ni fase excéntrica previa.",
      },
      {
        value: "eccentric",
        label: "Excéntrico",
        description:
          "Se enfatiza la fase de descenso con control y carga planificada.",
      },
      {
        value: "max_isometric",
        label: "Isometría máxima",
        description:
          "Contracción máxima sin movimiento durante un tiempo breve.",
      },
      {
        value: "total_isometric",
        label: "Isometría total",
        description:
          "Se mantiene una posición estática durante un tiempo prolongado.",
      },
      {
        value: "static_dynamic",
        label: "Estático-dinámico",
        description:
          "Combina una pausa isométrica con una fase dinámica explosiva.",
      },
    ],
  },
  {
    label: "Potencia y velocidad",
    methods: [
      {
        value: "contrast",
        label: "Contrastes",
        description:
          "Alterna cargas altas y bajas buscando máxima velocidad de ejecución.",
      },
      {
        value: "power_based",
        label: "Basado en potencia",
        description: "La carga se ajusta para maximizar la potencia producida.",
      },
      {
        value: "dynamic_effort",
        label: "Esfuerzo dinámico",
        description:
          "Carga submáxima movilizada con intención de velocidad máxima.",
      },
      {
        value: "eccentric_concentric_explosive",
        label: "Excéntrico-concéntrico explosivo",
        description:
          "Descenso controlado seguido de una fase concéntrica explosiva.",
      },
      {
        value: "plyometric",
        label: "Pliometría",
        description:
          "Ciclo rápido de estiramiento-acortamiento con contacto breve.",
      },
      {
        value: "specific_loads",
        label: "Cargas específicas",
        description:
          "Reproduce la carga y velocidad características del gesto deportivo.",
      },
      {
        value: "reactive_strength",
        label: "Fuerza reactiva",
        description:
          "Busca producir fuerza rápidamente tras un estímulo excéntrico.",
      },
    ],
  },
  {
    label: "Resistencia",
    methods: [
      {
        value: "strength_endurance",
        label: "Resistencia a la fuerza",
        description:
          "Trabajo sostenido para mantener la producción de fuerza bajo fatiga.",
      },
      {
        value: "extensive_intervals",
        label: "Intervalos extensivos",
        description:
          "Bloques de trabajo submáximo con pausas breves y volumen elevado.",
      },
      {
        value: "intermittent",
        label: "Intermitente",
        description: "Alterna esfuerzos cortos y recuperaciones frecuentes.",
      },
    ],
  },
] as const satisfies readonly TrainingMethodGroup[];

export const trainingMethods =
  trainingMethodGroups.flatMap<TrainingMethodOption>((group) =>
    group.methods.map<TrainingMethodOption>((method) => method),
  );

const trainingMethodValues = new Set<string>(
  trainingMethods.map((method) => method.value),
);

export function isTrainingMethod(value: string): value is TrainingMethod {
  return trainingMethodValues.has(value);
}

export function getTrainingMethod(value: TrainingMethod) {
  return (
    trainingMethods.find((method) => method.value === value) ??
    trainingMethods[0]
  );
}
