import { StyleSheet } from 'react-native';

export const colors = {
  primary: {
    50: '#eff6ff', // Very light blue
    100: '#dbeafe', // Light blue
    200: '#bfdbfe', // Lighter blue
    300: '#93c5fd', // Light blue
    400: '#60a5fa', // Medium light blue
    500: '#3b82f6', // Main blue
    600: '#2563eb', // Medium blue
    700: '#1d4ed8', // Dark blue
    800: '#1e40af', // Darker blue
    900: '#1e3a8a', // Very dark blue
  },
  secondary: {
    50: '#f0f9ff', // Very light cyan
    100: '#e0f2fe', // Light cyan
    200: '#bae6fd', // Lighter cyan
    300: '#7dd3fc', // Light cyan
    400: '#38bdf8', // Medium light cyan
    500: '#0ea5e9', // Main cyan
    600: '#0284c7', // Medium cyan
    700: '#0369a1', // Dark cyan
    800: '#075985', // Darker cyan
    900: '#0c4a6e', // Very dark cyan
  },
  danger: {
    50: '#fef2f2', // Very light red
    100: '#fee2e2', // Light red
    200: '#fecaca', // Lighter red
    300: '#fca5a5', // Light red
    400: '#f87171', // Medium light red
    500: '#ef4444', // Main red
    600: '#dc2626', // Medium red
    700: '#b91c1c', // Dark red
    800: '#991b1b', // Darker red
    900: '#7f1d1d', // Very dark red
  },
  warning: {
    50: '#fffbeb', // Very light amber
    100: '#fef3c7', // Light amber
    200: '#fde68a', // Lighter amber
    300: '#fcd34d', // Light amber
    400: '#fbbf24', // Medium light amber
    500: '#f59e0b', // Main amber
    600: '#d97706', // Medium amber
    700: '#b45309', // Dark amber
    800: '#92400e', // Darker amber
    900: '#78350f', // Very dark amber
  },
  gray: {
    50: '#f9fafb', // Very light gray
    100: '#f3f4f6', // Light gray
    200: '#e5e7eb', // Lighter gray
    300: '#d1d5db', // Light gray
    400: '#9ca3af', // Medium light gray
    500: '#6b7280', // Main gray
    600: '#4b5563', // Medium gray
    700: '#374151', // Dark gray
    800: '#1f2937', // Darker gray
    900: '#111827', // Very dark gray
  },
  white: '#ffffff', // Pure white
  black: '#000000', // Pure black

  medical: {
    50: '#f0fdf4', // Very light green
    100: '#dcfce7', // Light green
    200: '#bbf7d0', // Lighter green
    300: '#86efac', // Light green
    400: '#4ade80', // Medium light green
    500: '#22c55e', // Main green
    600: '#16a34a', // Medium green
    700: '#15803d', // Dark green
    800: '#166534', // Darker green
    900: '#14532d', // Very dark green
  },
  emergency: {
    50: '#fef2f2', // Very light red
    100: '#fee2e2', // Light red
    200: '#fecaca', // Lighter red
    300: '#fca5a5', // Light red
    400: '#f87171', // Medium light red
    500: '#ef4444', // Main red
    600: '#dc2626', // Medium red
    700: '#b91c1c', // Dark red
    800: '#991b1b', // Darker red
    900: '#7f1d1d', // Very dark red
  },
};

export const styles = StyleSheet.create({
  // ===========================================
  // LAYOUT & FLEXBOX
  // ===========================================
  
  // Flex
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
  flexGrow: { flexGrow: 1 },
  flexShrink: { flexShrink: 1 },
  flexNone: { flex: 0 },
  
  // Flex Direction
  flexRow: { flexDirection: 'row' },
  flexCol: { flexDirection: 'column' },
  
  // Flex Wrap
  flexWrap: { flexWrap: 'wrap' },
  flexNoWrap: { flexWrap: 'nowrap' },
  
  // Justify Content
  justifyCenter: { justifyContent: 'center' },
  justifyStart: { justifyContent: 'flex-start' },
  justifyEnd: { justifyContent: 'flex-end' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  justifyEvenly: { justifyContent: 'space-evenly' },
  
  // Align Items
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  alignStretch: { alignItems: 'stretch' },
  alignBaseline: { alignItems: 'baseline' },
  
  // Align Self
  selfCenter: { alignSelf: 'center' },
  selfStart: { alignSelf: 'flex-start' },
  selfEnd: { alignSelf: 'flex-end' },
  
  // Gap
  gap1: { gap: 4 },
  gap2: { gap: 8 },
  gap3: { gap: 12 },
  gap4: { gap: 16 },

  // ===========================================
  // POSITIONING
  // ===========================================
  
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  
  // Top
  top0: { top: 0 },
  top10: { top: 10 },
  top20: { top: 20 },
  top40: { top:40 },
  top50: { top: 50 },
  
  // Bottom
  bottom0: { bottom: 0 },
  bottom10: { bottom: 10 },
  
  // Left
  left0: { left: 0 },
  left1: { left: 4 },
  left2: { left: 8 },
  left5: { left: 20 },
  left10: { left: 40 },
  left25: { left: 10 },
  
  // Right
  right0: { right: 0 },
  right1: { right: 4 },
  right2: { right: 8 },
  right5: { right: 20 },
  right10: { right: 40 },
  right25: { right: 10 },
  
  // Z-Index
  z0: { zIndex: 0 },
  z10: { zIndex: 10 },
  z20: { zIndex: 20 },
  z30: { zIndex: 30 },
  z40: { zIndex: 40 },
  z50: { zIndex: 50 },
  z999: { zIndex: 999 },
  z1000: { zIndex: 1000 },

  // ===========================================
  // SIZING
  // ===========================================
  
  // Width
  w0Point5: { width: 2 },
  w1: { width: 4 },
  w2: { width: 8 },
  w3: { width: 12 },
  w4: { width: 16 },
  w5: { width: 20 },
  w6: { width: 24 },
  w7: { width: 28 },
  w8: { width: 32 },
  w9: { width: 36 },
  w10: { width: 40 },
  w11: { width: 44 },
  w12: { width: 48 },
  w14: { width: 56 },
  w16: { width: 64 },
  w20: { width: 80 },
  w24: { width: 96 },
  w28: { width: 112 },
  w30: { width: 120 },
  w32: { width: 128 },
  w36: { width: 144 },
  w40: { width: 160 },
  w48: { width: 192 },
  w56: { width: 224 },
  w64: { width: 256 },
  
  // Width Percentages
  w1_4: { width: '25%' },
  w1_3: { width: '33.333%' },
  w1_2: { width: '50%' },
  w2_3: { width: '66.666%' },
  wHalf: { width: '50%' },
  wFull: { width: '100%' },
  w100: { width: '100%' },
  
  // Min/Max Width
  minW0: { minWidth: 0 },
  minWFull: { minWidth: '100%' },
  maxWFull: { maxWidth: '100%' },
  
  // Height
  h0Point5: { height: 2 },
  h1: { height: 4 },
  h2: { height: 8 },
  h3: { height: 12 },
  h4: { height: 16 },
  h5: { height: 20 },
  h6: { height: 24 },
  h7: { height: 28 },
  h8: { height: 32 },
  h9: { height: 36 },
  h10: { height: 40 },
  h11: { height: 44 },
  h12: { height: 48 },
  h14: { height: 56 },
  h16: { height: 64 },
  h18: { height: 72 },
  h20: { height: 80 },
  h24: { height: 96 },
  h28: { height: 112 },
  h32: { height: 128 },
  h40: { height: 160 },
  h48: { height: 192 },
  h56: { height:224 },
  h64: { height: 256 },
  hFull: { height: '100%' },
  
  // Min/Max Height
  minH0: { minHeight: 0 },
  minH10: { minHeight: '10%' },
  minH20: { minHeight: '20%' },
  minH30: { minHeight: '30%' },
  minH50: { minHeight: '50%' },
  minH70: { minHeight: '70%' },
  minH80: { minHeight: '80%' },
  minHFull: { minHeight: '100%' },
  maxH20: { maxHeight: '20%' },
  maxH40: { maxHeight: '40%' },
  maxH80: { maxHeight: '80%' },
  maxHFull: { maxHeight: '100%' },
  
  // Square (Width and Height Equal)
  square1: { width: 4, height: 4 },
  square2: { width: 8, height: 8 },
  square3: { width: 12, height: 12 },
  square4: { width: 16, height: 16 },
  square5: { width: 20, height: 20 },
  square6: { width: 24, height: 24 },
  square7: { width: 28, height: 28 },
  square8: { width: 32, height: 32 },
  square9: { width: 36, height: 36 },
  square10: { width: 40, height: 40 },
  square11: { width: 44, height: 44 },
  square12: { width: 48, height: 48 },
  square14: { width: 56, height: 56 },
  square16: { width: 64, height: 64 },
  square20: { width: 80, height: 80 },

  // ===========================================
  // SPACING
  // ===========================================
  
  // Padding All
  p0: { padding: 0 },
  p1: { padding: 4 },
  p2: { padding: 8 },
  p25: { padding: 10 },
  p3: { padding: 12 },
  p4: { padding: 16 },
  p5: { padding: 20 },
  p6: { padding: 24 },
  
  // Padding Horizontal
  px1: { paddingHorizontal: 4 },
  px2: { paddingHorizontal: 8 },
  px3: { paddingHorizontal: 12 },
  px4: { paddingHorizontal: 16 },
  px5: { paddingHorizontal: 20 },
  
  // Padding Vertical
  py1: { paddingVertical: 4 },
  py2: { paddingVertical: 8 },
  py3: { paddingVertical: 12 },
  py4: { paddingVertical: 16 },
  py5: { paddingVertical: 20 },
  py6: { paddingVertical: 24 },
  
  // Padding Individual Sides
  pt1: { paddingTop: 4 },
  pt2: { paddingTop: 8 },
  pt3: { paddingTop: 12 },
  pt4: { paddingTop: 16 },
  pt5: { paddingTop: 20 },
  pt6: { paddingTop: 24 },
  pt8: { paddingTop: 32 },
  pt10: { paddingTop: 40 },
  pt50: { paddingTop: 50 },
  pb1: { paddingBottom: 4 },
  pb2: { paddingBottom: 8 },
  pb3: { paddingBottom: 12 },
  pb4: { paddingBottom: 16 },
  pb8: { paddingBottom: 32},
  pl1: { paddingLeft: 4 },
  pl2: { paddingLeft: 8 },
  pl3: { paddingLeft: 12 },
  pl4: { paddingLeft: 16 },
  pr1: { paddingRight: 4 },
  pr2: { paddingRight: 8 },
  pr3: { paddingRight: 12 },
  pr4: { paddingRight: 16 },
  
  // Margin All
  m0: { margin: 0 },
  m1: { margin: 4 },
  m2: { margin: 8 },
  m3: { margin: 12 },
  m4: { margin: 16 },
  m5: { margin: 20 },
  m6: { margin: 24 },
  
  // Margin Horizontal
  mx1: { marginHorizontal: 4 },
  mx2: { marginHorizontal: 8 },
  mx3: { marginHorizontal: 12 },
  mx4: { marginHorizontal: 16 },
  mx6: { marginHorizontal: 24 },
  
  // Margin Vertical
  my1: { marginVertical: 4 },
  my2: { marginVertical: 8 },
  my3: { marginVertical: 12 },
  my4: { marginVertical: 16 },
  
  // Margin Individual Sides
  mt0: { marginTop: 0 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
  mt4: { marginTop: 16 },
  mt5: { marginTop: 20 },
  mt6: { marginTop: 24 },
  mt8: { marginTop: 32 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb25: { marginBottom: 10 },
  mb3: { marginBottom: 12 },
  mb4: { marginBottom: 16 },
  mb5: { marginBottom: 20 },
  mb6: { marginBottom: 24 },
  mb8: {marginBottom: 32},
  ml1: { marginLeft: 4 },
  ml2: { marginLeft: 8 },
  ml3: { marginLeft: 12 },
  ml4: { marginLeft: 16 },
  mr1: { marginRight: 4 },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 12 },
  mr4: { marginRight: 16 },

  // ===========================================
  // TYPOGRAPHY
  // ===========================================
  
  // Font Size
  textXs: { fontSize: 12 },
  textSm: { fontSize: 14 },
  textBase: { fontSize: 16 },
  textLg: { fontSize: 18 },
  textXl: { fontSize: 20 },
  text2xl: { fontSize: 24 },
  text3xl: { fontSize: 30 },
  text4xl: { fontSize: 36 },
  
  // Font Weight
  fontThin: { fontWeight: '100' },
  fontLight: { fontWeight: '300' },
  fontNormal: { fontWeight: '400' },
  fontMedium: { fontWeight: '500' },
  fontSemibold: { fontWeight: '600' },
  fontBold: { fontWeight: 'bold' },
  fontExtraBold: { fontWeight: '800' },
  fontBlack: { fontWeight: '900' },
  
  // Font Style
  italic: { fontStyle: 'italic' },
  
  // Text Align
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },
  
  // Text Decoration
  underline: { textDecorationLine: 'underline' },
  lineThrough: { textDecorationLine: 'line-through' },

  // ===========================================
  // COLORS - BACKGROUNDS
  // ===========================================
  
  // Base Colors
  bgWhite: { backgroundColor: colors.white },
  bgBlack: { backgroundColor: colors.black },
  
  // Gray Backgrounds
  bgGray50: { backgroundColor: colors.gray[50] },
  bgGray100: { backgroundColor: colors.gray[100] },
  bgGray200: { backgroundColor: colors.gray[200] },
  bgGray300: { backgroundColor: colors.gray[300] },
  bgGray400: { backgroundColor: colors.gray[400] },
  bgGray500: { backgroundColor: colors.gray[500] },
  bgGray600: { backgroundColor: colors.gray[600] },
  bgGray700: { backgroundColor: colors.gray[700] },
  bgGray800: { backgroundColor: colors.gray[800] },
  bgGray900: { backgroundColor: colors.gray[900] },
  
  // Primary Backgrounds
  bgPrimary50: { backgroundColor: colors.primary[50] },
  bgPrimary100: { backgroundColor: colors.primary[100] },
  bgPrimary200: { backgroundColor: colors.primary[200] },
  bgPrimary300: { backgroundColor: colors.primary[300] },
  bgPrimary400: { backgroundColor: colors.primary[400] },
  bgPrimary500: { backgroundColor: colors.primary[500] },
  bgPrimary600: { backgroundColor: colors.primary[600] },
  bgPrimary700: { backgroundColor: colors.primary[700] },
  bgPrimary800: { backgroundColor: colors.primary[800] },
  bgPrimary900: { backgroundColor: colors.primary[900] },
  
  // Secondary Backgrounds
  bgSecondary50: { backgroundColor: colors.secondary[50] },
  bgSecondary100: { backgroundColor: colors.secondary[100] },
  bgSecondary200: { backgroundColor: colors.secondary[200] },
  bgSecondary300: { backgroundColor: colors.secondary[300] },
  bgSecondary400: { backgroundColor: colors.secondary[400] },
  bgSecondary500: { backgroundColor: colors.secondary[500] },
  bgSecondary600: { backgroundColor: colors.secondary[600] },
  bgSecondary700: { backgroundColor: colors.secondary[700] },
  bgSecondary800: { backgroundColor: colors.secondary[800] },
  bgSecondary900: { backgroundColor: colors.secondary[900] },
  
  // Medical Backgrounds
  bgMedical50: { backgroundColor: colors.medical[50] },
  bgMedical100: { backgroundColor: colors.medical[100] },
  bgMedical200: { backgroundColor: colors.medical[200] },
  bgMedical300: { backgroundColor: colors.medical[300] },
  bgMedical400: { backgroundColor: colors.medical[400] },
  bgMedical500: { backgroundColor: colors.medical[500] },
  bgMedical600: { backgroundColor: colors.medical[600] },
  bgMedical700: { backgroundColor: colors.medical[700] },
  bgMedical800: { backgroundColor: colors.medical[800] },
  bgMedical900: { backgroundColor: colors.medical[900] },
  
  // Warning Backgrounds
  bgWarning50: { backgroundColor: colors.warning[50] },
  bgWarning100: { backgroundColor: colors.warning[100] },
  bgWarning200: { backgroundColor: colors.warning[200] },
  bgWarning300: { backgroundColor: colors.warning[300] },
  bgWarning400: { backgroundColor: colors.warning[400] },
  bgWarning500: { backgroundColor: colors.warning[500] },
  bgWarning600: { backgroundColor: colors.warning[600] },
  bgWarning700: { backgroundColor: colors.warning[700] },
  bgWarning800: { backgroundColor: colors.warning[800] },
  bgWarning900: { backgroundColor: colors.warning[900] },
  
  // Danger Backgrounds
  bgDanger50: { backgroundColor: colors.danger[50] },
  bgDanger100: { backgroundColor: colors.danger[100] },
  bgDanger200: { backgroundColor: colors.danger[200] },
  bgDanger300: { backgroundColor: colors.danger[300] },
  bgDanger400: { backgroundColor: colors.danger[400] },
  bgDanger500: { backgroundColor: colors.danger[500] },
  bgDanger600: { backgroundColor: colors.danger[600] },
  bgDanger700: { backgroundColor: colors.danger[700] },
  bgDanger800: { backgroundColor: colors.danger[800] },
  bgDanger900: { backgroundColor: colors.danger[900] },
  
  // Emergency Backgrounds
  bgEmergency50: { backgroundColor: colors.emergency[50] },
  bgEmergency100: { backgroundColor: colors.emergency[100] },
  bgEmergency200: { backgroundColor: colors.emergency[200] },
  bgEmergency500: { backgroundColor: colors.emergency[500] },
  bgEmergency600: { backgroundColor: colors.emergency[600] },
  
  // Special Backgrounds
  bgGlassWhite: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },

  // ===========================================
  // COLORS - TEXT
  // ===========================================
  
  // Base Text Colors
  textWhite: { color: colors.white },
  textBlack: { color: colors.black },
  
  // Gray Text
  textGray400: { color: colors.gray[400] },
  textGray500: { color: colors.gray[500] },
  textGray600: { color: colors.gray[600] },
  textGray700: { color: colors.gray[700] },
  textGray800: { color: colors.gray[800] },
  textGray900: { color: colors.gray[900] },
  
  // Primary Text
  textPrimary50: { color: colors.primary[50] },
  textPrimary100: { color: colors.primary[100] },
  textPrimary200: { color: colors.primary[200] },
  textPrimary300: { color: colors.primary[300] },
  textPrimary400: { color: colors.primary[400] },
  textPrimary500: { color: colors.primary[500] },
  textPrimary600: { color: colors.primary[600] },
  textPrimary700: { color: colors.primary[700] },
  textPrimary800: { color: colors.primary[800] },
  textPrimary900: { color: colors.primary[900] },
  
  // Secondary Text
  textSecondary50: { color: colors.secondary[50] },
  textSecondary100: { color: colors.secondary[100] },
  textSecondary200: { color: colors.secondary[200] },
  textSecondary300: { color: colors.secondary[300] },
  textSecondary400: { color: colors.secondary[400] },
  textSecondary500: { color: colors.secondary[500] },
  textSecondary600: { color: colors.secondary[600] },
  textSecondary700: { color: colors.secondary[700] },
  textSecondary800: { color: colors.secondary[800] },
  textSecondary900: { color: colors.secondary[900] },
  
  // Medical Text
  textMedical50: { color: colors.medical[50] },
  textMedical100: { color: colors.medical[100] },
  textMedical200: { color: colors.medical[200] },
  textMedical300: { color: colors.medical[300] },
  textMedical400: { color: colors.medical[400] },
  textMedical500: { color: colors.medical[500] },
  textMedical600: { color: colors.medical[600] },
  textMedical700: { color: colors.medical[700] },
  textMedical800: { color: colors.medical[800] },
  textMedical900: { color: colors.medical[900] },
  
  // Warning Text
  textWarning50: { color: colors.warning[50] },
  textWarning100: { color: colors.warning[100] },
  textWarning200: { color: colors.warning[200] },
  textWarning300: { color: colors.warning[300] },
  textWarning400: { color: colors.warning[400] },
  textWarning500: { color: colors.warning[500] },
  textWarning600: { color: colors.warning[600] },
  textWarning700: { color: colors.warning[700] },
  textWarning800: { color: colors.warning[800] },
  textWarning900: { color: colors.warning[900] },
  
  // Danger Text
  textDanger50: { color: colors.danger[50] },
  textDanger100: { color: colors.danger[100] },
  textDanger200: { color: colors.danger[200] },
  textDanger300: { color: colors.danger[300] },
  textDanger400: { color: colors.danger[400] },
  textDanger500: { color: colors.danger[500] },
  textDanger600: { color: colors.danger[600] },
  textDanger700: { color: colors.danger[700] },
  textDanger800: { color: colors.danger[800] },
  textDanger900: { color: colors.danger[900] },
  
  // Emergency Text
  textEmergency500: { color: colors.emergency[500] },
  textEmergency600: { color: colors.emergency[600] },

  // ===========================================
  // BORDERS
  // ===========================================
  
  // Border Width
  border: { borderWidth: 1 },
  border2: { borderWidth: 2 },
  border4: { borderWidth: 4 },
  border8: { borderWidth: 8 },
  borderWidth2: { borderWidth: 2 },
  
  // Border Sides
  borderT: { borderTopWidth: 1 },
  borderB: { borderBottomWidth: 1 },
  borderB1: { borderBottomWidth: 1 },
  borderL: { borderLeftWidth: 1 },
  borderR: { borderRightWidth: 1 },
  
  // Border Colors - Gray
  borderGray100: { borderColor: colors.gray[100] },
  borderGray200: { borderColor: colors.gray[200] },
  borderGray300: { borderColor: colors.gray[300] },
  borderGray400: { borderColor: colors.gray[400] },
  borderGray500: { borderColor: colors.gray[500] },

  borderBlack: { borderColor: colors.black },

  // Border Colors - Primary
  borderPrimary100: { borderColor: colors.primary[100] },
  borderPrimary200: { borderColor: colors.primary[200] },
  borderPrimary300: { borderColor: colors.primary[300] },
  borderPrimary400: { borderColor: colors.primary[400] },
  borderPrimary500: { borderColor: colors.primary[500] },
  borderPrimary600: { borderColor: colors.primary[600] },
  borderPrimary700: { borderColor: colors.primary[700] },
  borderPrimary800: { borderColor: colors.primary[800] },
  
  // Border Colors - Secondary
  borderSecondary100: { borderColor: colors.secondary[100] },
  borderSecondary200: { borderColor: colors.secondary[200] },
  borderSecondary300: { borderColor: colors.secondary[300] },
  borderSecondary400: { borderColor: colors.secondary[400] },
  borderSecondary500: { borderColor: colors.secondary[500] },
  borderSecondary600: { borderColor: colors.secondary[600] },
  borderSecondary700: { borderColor: colors.secondary[700] },
  borderSecondary800: { borderColor: colors.secondary[800] },
  
  // Border Colors - Medical
  borderMedical100: { borderColor: colors.medical[100] },
  borderMedical200: { borderColor: colors.medical[200] },
  borderMedical300: { borderColor: colors.medical[300] },
  borderMedical400: { borderColor: colors.medical[400] },
  borderMedical500: { borderColor: colors.medical[500] },
  borderMedical600: { borderColor: colors.medical[600] },
  borderMedical700: { borderColor: colors.medical[700] },
  borderMedical800: { borderColor: colors.medical[800] },
  
  // Border Colors - Warning
  borderWarning100: { borderColor: colors.warning[100] },
  borderWarning200: { borderColor: colors.warning[200] },
  borderWarning300: { borderColor: colors.warning[300] },
  borderWarning400: { borderColor: colors.warning[400] },
  borderWarning500: { borderColor: colors.warning[500] },
  borderWarning600: { borderColor: colors.warning[600] },
  borderWarning700: { borderColor: colors.warning[700] },
  borderWarning800: { borderColor: colors.warning[800] },
  
  // Border Colors - Danger
  borderDanger100: { borderColor: colors.danger[100] },
  borderDanger200: { borderColor: colors.danger[200] },
  borderDanger300: { borderColor: colors.danger[300] },
  borderDanger400: { borderColor: colors.danger[400] },
  borderDanger500: { borderColor: colors.danger[500] },
  borderDanger600: { borderColor: colors.danger[600] },
  borderDanger700: { borderColor: colors.danger[700] },
  borderDanger800: { borderColor: colors.danger[800] },
  
  // Border Colors - Emergency
  borderEmergency200: { borderColor: colors.emergency[200] },
  borderEmergency500: { borderColor: colors.emergency[500] },
  
  // Border Radius
  roundedNone: { borderRadius: 0 },
  rounded: { borderRadius: 6 },
  roundedSm: { borderRadius: 4 },
  roundedMd: { borderRadius: 6 },
  roundedLg: { borderRadius: 8 },
  roundedXl: { borderRadius: 12 },
  rounded2xl: { borderRadius: 16 },
  rounded3xl: { borderRadius: 24 },
  rounded4xl: { borderRadius: 32 },
  roundedFull: { borderRadius: 9999 },
  
  // Individual Corner Radius
  roundedTl3xl: { borderTopLeftRadius: 24 },
  roundedTr3xl: { borderTopRightRadius: 24 },

  // ===========================================
  // EFFECTS
  // ===========================================
  
  // Standard Shadows
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  shadowXl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
  },
  shadow2xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Colored Shadows
  shadowPrimary: {
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowSecondary: {
    shadowColor: colors.secondary[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowMedical: {
    shadowColor: colors.medical[800],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  shadowWarning: {
    shadowColor: colors.warning[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowDanger: {
    shadowColor: colors.danger[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Opacity
  opacity0: { opacity: 0 },
  opacity25: { opacity: 0.25 },
  opacity50: { opacity: 0.5 },
  opacity75: { opacity: 0.75 },
  opacity100: { opacity: 1 },

  // ===========================================
  // INTERACTIVITY
  // ===========================================
  
  // Overflow
  overflowHidden: { overflow: 'hidden' },
  overflowScroll: { overflow: 'scroll' },
  overflowVisible: { overflow: 'visible' },

  // ===========================================
  // APP-SPECIFIC UTILITIES
  // ===========================================
  
  // Drawer Heights
  drawerMinimized: { height: 120 },
  drawerPartial: { height: '50%' },
  drawerFull: { height: '90%' },
  
  // ===========================================
  // TRANSFORM & ANIMATION
  // ===========================================
  
  // Scale
  scale50: { transform: [{ scale: 0.5 }] },
  scale75: { transform: [{ scale: 0.75 }] },
  scale90: { transform: [{ scale: 0.9 }] },
  scale95: { transform: [{ scale: 0.95 }] },
  scale100: { transform: [{ scale: 1.0 }] },
  scale105: { transform: [{ scale: 1.05 }] },
  scale110: { transform: [{ scale: 1.1 }] },
  scale125: { transform: [{ scale: 1.25 }] },
  scale150: { transform: [{ scale: 1.5 }] },
  
  // Rotate
  rotate0: { transform: [{ rotate: '0deg' }] },
  rotate45: { transform: [{ rotate: '45deg' }] },
  rotate90: { transform: [{ rotate: '90deg' }] },
  rotate180: { transform: [{ rotate: '180deg' }] },
  rotate270: { transform: [{ rotate: '270deg' }] },

  // ===========================================
  // RESPONSIVE & ACCESSIBILITY
  // ===========================================
  
  // Screen Reader Only (Web-like behavior for React Native)
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
  },
  
  // Focus & Interaction States
  pointerEventsNone: { pointerEvents: 'none' as 'none' },
  pointerEventsAuto: { pointerEvents: 'auto' as 'auto' },

  // ===========================================
  // COMMON PATTERNS & PRESETS
  // ===========================================
  
  // Common Card Pattern
  cardDefault: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  
  // Common Button Pattern
  buttonPrimary: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },
  
  buttonSecondary: {
    backgroundColor: colors.secondary[100],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    borderWidth: 1,
    borderColor: colors.secondary[300],
  },
  
  // Common Input Pattern
  inputDefault: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  
  inputFocused: {
    borderColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

// ===========================================
// EXPORTS & UTILITIES
// ===========================================

// Utility function to combine styles safely
export const combineStyles = (...styles: any[]) => {
  return styles.filter(Boolean);
};

// Theme utilities for dynamic theming
export const getColorShade = (colorFamily: string, shade: string | number) => {
  const family = (colors as any)[colorFamily];
  if (family && typeof family === 'object') {
    return family[shade] || family[500]; 
  }
  return colors.gray[500]; 
};

// Common style combinations
export const commonStyles = {
  // Centered container
  centeredContainer: [
    styles.flex1,
    styles.justifyCenter,
    styles.alignCenter,
    styles.p4,
  ],
  
  // Full screen modal
  fullScreenModal: [
    styles.flex1,
    styles.bgWhite,
    styles.pt50,
  ],
  
  // Card with shadow
  elevatedCard: [
    styles.bgWhite,
    styles.rounded2xl,
    styles.p6,
    styles.shadowLg,
    styles.border,
    styles.borderGray200,
  ],
  
  // Primary action button
  primaryButton: [
    styles.bgPrimary600,
    styles.py3,
    styles.px5,
    styles.roundedXl,
    styles.alignCenter,
    styles.shadowMd,
  ],
  
  // Secondary action button
  secondaryButton: [
    styles.bgSecondary100,
    styles.py3,
    styles.px5,
    styles.roundedXl,
    styles.alignCenter,
    styles.border,
    styles.borderSecondary300,
  ],
};
