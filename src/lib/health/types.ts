export type YesNo = "yes" | "no";

export type HealthScreeningPayload = {
  fullName: string;
  birthDate: string;
  sex: "female" | "male" | "other" | "prefer_not_to_say";
  weightKg: number;
  heightCm: number;
  emergencyContact: { name: string; phone: string; relationship: string };
  physician: { name: string; phone: string } | null;
  riskAnswers: Record<
    | "heartCondition"
    | "chestPain"
    | "dizzinessOrFainting"
    | "highBloodPressureOrDiabetes"
    | "boneOrJointProblem"
    | "supervisedActivityOnly",
    YesNo
  >;
  chronicConditions: string[];
  otherChronicConditions: string;
  surgeries: string;
  injuries: Array<{ area: string; approximateDate: string; details: string }>;
  medications: string;
  allergies: string;
  pregnancy: { applies: boolean; weeks: number | null };
  smoking: "never" | "current" | "former";
  activityLevel: "sedentary" | "occasional" | "active";
  truthAccepted: true;
  liabilityAccepted: true;
  sensitiveDataAccepted: true;
  signedName: string;
  signedAt: string;
};

export type HealthDecision =
  | "cleared"
  | "cleared_with_restrictions"
  | "medical_clearance_required";

export type HealthScreeningSummary = {
  id: string;
  version: number;
  hasCriticalRisk: boolean;
  submittedAt: string;
  expiresAt: string;
  decision: HealthDecision | null;
  reviewNotes: string;
};
