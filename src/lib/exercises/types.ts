export type ExerciseTaxonomyOption = {
  id: string;
  name: string;
};

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl: string;
  bodyZones: ExerciseTaxonomyOption[];
  equipment: ExerciseTaxonomyOption[];
};

export type ExerciseEditorData = {
  exercise: ExerciseCatalogItem | null;
  bodyZones: ExerciseTaxonomyOption[];
  equipment: ExerciseTaxonomyOption[];
};

export type PaginatedExercises = {
  exercises: ExerciseCatalogItem[];
  page: number;
  pageCount: number;
  total: number;
  error: string | null;
};
