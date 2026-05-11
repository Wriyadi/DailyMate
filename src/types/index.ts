export type VehicleType = 'car' | 'motorcycle';
export type FuelType = 'gasoline' | 'diesel';
export type Transmission = 'automatic' | 'manual';

export interface Vehicle {
  id?: string;
  ownerId: string;
  type: VehicleType;
  brand: string;
  transmission: Transmission;
  fuelType: FuelType;
  name: string;
  odometer: number;
  lastServiceMileage: number;
  lastServiceDate: string;
  maintenanceInterval: number;
}

export interface ServiceLog {
  id?: string;
  date: string;
  mileage: number;
  description: string;
  costRupiah: number;
}

export type HealthLogType = 'bmi' | 'cycle' | 'symptom' | 'exercise' | 'meal' | 'vaccination' | 'pediatric_triage';

export interface HealthLog {
  id?: string;
  userId: string;
  childId?: string;
  type: HealthLogType;
  rating?: number;
  date: string;
  note?: string;
  metadata: any;
}

export interface Child {
  id?: string;
  parentId: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  height?: number;
  weight?: number;
  bmi?: number;
  allergies?: string;
  givenVaccines?: string[];
  vaccineRecommendation?: string;
  nutritionRecommendation?: string;
}

export interface Pet {
  id?: string;
  ownerId: string;
  name: string;
  species: string;
  birthDate: string;
  healthNotes?: string;
}

export interface Plant {
  id?: string;
  ownerId: string;
  name: string;
  species: string;
  wateringSchedule: number;
  lastWatered: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  allergies?: string;
  lastOvulationDate?: string;
  cuisinePreferences?: string[];
  healthRating?: number;
  chronicDiseases?: string[];
}

