export enum RideStatus {
  SEARCHING = "SEARCHING_FOR_RIDER",
  START = "START",
  ARRIVED = "ARRIVED",
  COMPLETED = "COMPLETED"
}

export enum AmbulanceType {
  BLS = "bls",
  ALS = "als", 
  CCS = "ccs",
  AUTO = "auto",
  BIKE = "bike"
}

export enum CertificationLevel {
  EMT_BASIC = "EMT-Basic",
  EMT_INTERMEDIATE = "EMT-Intermediate",
  EMT_PARAMEDIC = "EMT-Paramedic",
  CRITICAL_CARE = "Critical Care"
}

export type Location = {
  address: string;
  latitude: number;
  longitude: number;
};

export type Vehicle = {
  type: AmbulanceType;
  plateNumber: string;
  model: string;
  licenseNumber: string;
  certificationLevel: CertificationLevel;
};

export type User = {
  _id: string;
  phone: string;
  name?: string;
  email?: string;
};

export type Driver = User & {
  role: "driver";
  isOnline: boolean;
  vehicle: Vehicle;
  createdAt: string;
  updatedAt?: string;
};

export type Patient = User & {
  role: "patient";
};

export type Ride = {
  _id: string;
  vehicle: AmbulanceType;
  distance: number;
  fare: number;
  pickup: Location;
  drop: Location;
  customer: Patient | string;
  rider: Driver | null;
  status: RideStatus;
  otp: string;
  rating: number | null;
  createdAt: string;
  updatedAt?: string;
  emergency?: any;
  hospital?: string;
  hospitalDetails?: {
    placeId: string;
    name: string;
    latitude: number;
    longitude: number;
    rating: number;
    address: string;
    emergencyServices: string[];
    distance: number;
    isOpen: boolean;
    priceLevel: number | null;
    photos: any[];
    emergencyCapabilityScore: number;
    emergencyFeatures: string[];
    isEmergencyVerified: boolean;
  };
};

export type DriverStats = {
  totalRides: number;
  todayRides: number;
  todayEarnings: number;
  weeklyRides: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  rating: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
};

export type RideResponse = {
  message: string;
  ride?: Ride;
  rides?: Ride[];
  count?: number;
};
