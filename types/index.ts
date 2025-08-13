import { TextInputProps } from 'react-native';

// Component prop types
export interface LabelInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  helperText?: string;
  containerStyle?: any;
}

export interface LabelSelectProps {
  label: string;
  options: string[];
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  multiple?: boolean;
  helperText?: string;
  containerStyle?: any;
}

// Navigation types
export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    replace: (screen: string, params?: any) => void;
    goBack: () => void;
    reset: (state: any) => void;
  };
  route?: {
    params?: any;
    name?: string;
  };
}

// API Response types
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user?: any;
  message?: string;
}

// Driver Profile types
export interface HospitalAffiliation {
  isAffiliated: boolean;
  hospitalName: string;
  hospitalId: string;
  hospitalAddress: string;
  employeeId: string;
  customFareFormula?: {
    baseFare: number;
    perKmRate: number;
    minimumFare: number;
  };
}

export interface Vehicle {
  type: 'bls' | 'als' | 'ccs' | 'auto' | 'bike';
  plateNumber: string;
  model: string;
  licenseNumber: string;
  certificationLevel: 'EMT-Basic' | 'EMT-Intermediate' | 'EMT-Paramedic' | 'Critical Care';
}

export interface DriverProfile {
  _id?: string;
  name: string;
  email?: string;
  phone: string;
  vehicle: Vehicle;
  hospitalAffiliation: HospitalAffiliation;
  isOnline?: boolean;
  rating?: number;
  totalRides?: number;
  profileCompleted?: boolean;
}

export interface DriverFormData {
  name: string;
  email: string;
  vehicleType: 'bls' | 'als' | 'ccs' | 'auto' | 'bike' | '';
  plateNumber: string;
  model: string;
  licenseNumber: string;
  certificationLevel: 'EMT-Basic' | 'EMT-Intermediate' | 'EMT-Paramedic' | 'Critical Care' | '';
  hospitalAffiliation: HospitalAffiliation;
}

export interface DriverStats {
  totalRides: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  rating: number;
  todayRides: number;
  weeklyRides: number;
  availableRidesCount: number;
}
