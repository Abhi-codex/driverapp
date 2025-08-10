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
