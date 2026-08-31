export type MeasurementClient = {
  id: string;
  firstName: string;
  lastName: string;
};

export type BodyMeasurement = {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  weight: number | null;
  height: number | null;
  fatPercentage: number | null;
  neck: number | null;
  chest: number | null;
  shoulders: number | null;
  waist: number | null;
  hips: number | null;
  rightArm: number | null;
  leftArm: number | null;
  rightLeg: number | null;
  leftLeg: number | null;
  notes: string;
};
