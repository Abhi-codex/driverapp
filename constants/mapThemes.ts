import { colors } from './tailwindStyles';

// Theme-based color configuration for map controls
export const mapControlThemes = {
  light: {
    toggleButton: colors.white,
    panelBackground: colors.white,
    panelBackgroundSecondary: colors.gray[50],
    textPrimary: colors.gray[800],
    textSecondary: colors.gray[600],
    buttonInactive: colors.gray[100],
    buttonActive: colors.gray[700],
    buttonActiveText: colors.white,
    buttonInactiveText: colors.gray[700],
    featureActive: colors.primary[100],
    featureActiveText: colors.primary[700],
    featureActiveIcon: colors.primary[600],
    featureInactive: colors.gray[50],
    featureInactiveText: colors.gray[600],
    featureInactiveIcon: colors.gray[500],
    border: colors.gray[200],
  },
  dark: {
    toggleButton: colors.gray[800],
    panelBackground: colors.gray[800],
    panelBackgroundSecondary: colors.gray[700],
    textPrimary: colors.white,
    textSecondary: colors.gray[300],
    buttonInactive: colors.gray[600],
    buttonActive: colors.gray[400],
    buttonActiveText: colors.gray[900],
    buttonInactiveText: colors.gray[300],
    featureActive: colors.primary[800],
    featureActiveText: colors.primary[200],
    featureActiveIcon: colors.primary[300],
    featureInactive: colors.gray[700],
    featureInactiveText: colors.gray[300],
    featureInactiveIcon: colors.gray[400],
    border: colors.gray[600],
  }
};

// Map type options configuration
export const mapTypeOptions = [
  { key: 'standard', label: 'Standard', iconType: 'MaterialIcons', iconName: 'map' },
  { key: 'hybrid', label: 'Hybrid', iconType: 'MaterialIcons', iconName: 'satellite' },
  { key: 'terrain', label: 'Terrain', iconType: 'FontAwesome5', iconName: 'mountain' },
];
