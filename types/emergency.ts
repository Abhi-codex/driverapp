type AmbulanceType = 'bls' | 'als' | 'ccs' | 'auto' | 'bike';

export type EmergencyCategoryType = 
  | 'cardiac'
  | 'trauma'
  | 'respiratory'
  | 'neurological'
  | 'pediatric'
  | 'obstetric'
  | 'psychiatric'
  | 'burns'
  | 'poisoning'
  | 'general';

export interface EmergencyType {
  id: string;
  category: EmergencyCategoryType;
  name: string;
  description: string;
  icon: { name: string; library: string };
  requiredAmbulanceTypes: AmbulanceType[];
  requiredHospitalServices: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  searchKeywords: string[];
}

export interface EmergencyCategory {
  id: EmergencyCategoryType;
  name: string;
  icon: { name: string; library: string };
  color: string;
  emergencies: EmergencyType[];
}

// Common emergency types with their required services and ambulance types
export const EMERGENCY_TYPES: EmergencyType[] = [
  // Cardiac Emergencies
  {
    id: 'heart_attack',
    category: 'cardiac',
    name: 'Heart Attack',
    description: 'Chest pain, shortness of breath, suspected myocardial infarction',
    icon: { name: 'heartbeat', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['cardiology', 'intensive_care', 'surgery'],
    priority: 'critical',
    searchKeywords: ['heart attack', 'chest pain', 'myocardial infarction', 'cardiac arrest']
  },
  {
    id: 'cardiac_arrest',
    category: 'cardiac',
    name: 'Cardiac Arrest',
    description: 'Patient unconscious, no pulse, requires immediate CPR',
    icon: { name: 'heart-broken', library: 'MaterialCommunityIcons' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['cardiology', 'intensive_care', 'surgery'],
    priority: 'critical',
    searchKeywords: ['cardiac arrest', 'no pulse', 'unconscious', 'cpr']
  },
  {
    id: 'chest_pain',
    category: 'cardiac',
    name: 'Chest Pain',
    description: 'Non-specific chest pain, requires cardiac evaluation',
    icon: { name: 'lungs', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['cardiology', 'intensive_care', 'surgery'],
    priority: 'high',
    searchKeywords: ['chest pain', 'heart pain', 'cardiac evaluation']
  },

  // Trauma Emergencies
  {
    id: 'major_trauma',
    category: 'trauma',
    name: 'Major Trauma',
    description: 'Severe injuries from accidents, falls, or violence',
    icon: { name: 'user-injured', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['trauma_center', 'surgery', 'intensive_care', 'blood_bank'],
    priority: 'critical',
    searchKeywords: ['accident', 'trauma', 'severe injury', 'fracture', 'bleeding']
  },
  {
    id: 'motor_accident',
    category: 'trauma',
    name: 'Motor Vehicle Accident',
    description: 'Road traffic accident with potential injuries',
    icon: { name: 'car-crash', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['trauma_center', 'surgery', 'intensive_care', 'blood_bank'],
    priority: 'critical',
    searchKeywords: ['car accident', 'road accident', 'vehicle crash', 'rta']
  },
  {
    id: 'burns',
    category: 'burns',
    name: 'Burn Injuries',
    description: 'Thermal, chemical, or electrical burns',
    icon: { name: 'fire', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['burn_unit', 'intensive_care', 'surgery'],
    priority: 'critical',
    searchKeywords: ['burn', 'fire injury', 'thermal burn', 'chemical burn']
  },

  // Respiratory Emergencies
  {
    id: 'breathing_difficulty',
    category: 'respiratory',
    name: 'Breathing Difficulty',
    description: 'Shortness of breath, asthma attack, respiratory distress',
    icon: { name: 'lungs', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['intensive_care', 'emergency_room'],
    priority: 'high',
    searchKeywords: ['breathing problem', 'shortness of breath', 'asthma', 'respiratory']
  },
  {
    id: 'choking',
    category: 'respiratory',
    name: 'Choking',
    description: 'Airway obstruction, unable to breathe or speak',
    icon: { name: 'user-slash', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['intensive_care', 'emergency_room'],
    priority: 'critical',
    searchKeywords: ['choking', 'airway obstruction', 'cannot breathe']
  },

  // Neurological Emergencies
  {
    id: 'stroke',
    category: 'neurological',
    name: 'Stroke',
    description: 'Sudden weakness, speech problems, facial drooping',
    icon: { name: 'brain', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['neurology', 'intensive_care', 'surgery'],
    priority: 'critical',
    searchKeywords: ['stroke', 'brain attack', 'paralysis', 'speech problem']
  },
  {
    id: 'seizure',
    category: 'neurological',
    name: 'Seizure',
    description: 'Epileptic seizure or convulsions',
    icon: { name: 'bolt', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['neurology', 'intensive_care', 'surgery'],
    priority: 'high',
    searchKeywords: ['seizure', 'epilepsy', 'convulsions', 'fits']
  },
  {
    id: 'head_injury',
    category: 'neurological',
    name: 'Head Injury',
    description: 'Traumatic brain injury, concussion, head trauma',
    icon: { name: 'user-injured', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['neurology', 'intensive_care', 'surgery'],
    priority: 'critical',
    searchKeywords: ['head injury', 'brain injury', 'concussion', 'head trauma']
  },

  // Pediatric Emergencies
  {
    id: 'pediatric_emergency',
    category: 'pediatric',
    name: 'Child Emergency',
    description: 'Medical emergency involving children under 18',
    icon: { name: 'child', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['pediatrics', 'emergency_room'],
    priority: 'high',
    searchKeywords: ['child emergency', 'pediatric', 'baby', 'infant']
  },
  {
    id: 'newborn_emergency',
    category: 'pediatric',
    name: 'Newborn Emergency',
    description: 'Emergency involving newborn or infant',
    icon: { name: 'baby', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['pediatrics', 'emergency_room'],
    priority: 'critical',
    searchKeywords: ['newborn', 'infant emergency', 'baby emergency']
  },

  // Obstetric Emergencies
  {
    id: 'pregnancy_emergency',
    category: 'obstetric',
    name: 'Pregnancy Emergency',
    description: 'Complications during pregnancy',
    icon: { name: 'female', library: 'FontAwesome' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['obstetrics', 'emergency_room'],
    priority: 'high',
    searchKeywords: ['pregnancy emergency', 'obstetric', 'maternal']
  },
  {
    id: 'labor_delivery',
    category: 'obstetric',
    name: 'Emergency Delivery',
    description: 'Imminent birth or delivery complications',
    icon: { name: 'baby', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als'],
    requiredHospitalServices: ['obstetrics', 'emergency_room'],
    priority: 'critical',
    searchKeywords: ['delivery', 'labor', 'birth', 'obstetric emergency']
  },

  // Psychiatric Emergencies
  {
    id: 'mental_health_crisis',
    category: 'psychiatric',
    name: 'Mental Health Crisis',
    description: 'Suicide risk, psychotic episode, severe depression',
    icon: { name: 'brain', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['psychiatry', 'emergency_room'],
    priority: 'high',
    searchKeywords: ['mental health', 'suicide', 'depression', 'psychiatric emergency']
  },

  // Poisoning
  {
    id: 'poisoning',
    category: 'poisoning',
    name: 'Poisoning/Overdose',
    description: 'Drug overdose, chemical poisoning, toxic ingestion',
    icon: { name: 'skull-crossbones', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['als', 'ccs'],
    requiredHospitalServices: ['emergency_room', 'intensive_care'],
    priority: 'critical',
    searchKeywords: ['poisoning', 'overdose', 'toxic', 'drug overdose']
  },

  // General Emergencies
  {
    id: 'general_emergency',
    category: 'general',
    name: 'General Medical Emergency',
    description: 'Other serious medical conditions requiring immediate care',
    icon: { name: 'exclamation-triangle', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['emergency_room'],
    priority: 'medium',
    searchKeywords: ['medical emergency', 'general emergency', 'urgent care']
  },
  {
    id: 'diabetic_emergency',
    category: 'general',
    name: 'Diabetic Emergency',
    description: 'Diabetic coma, hypoglycemia, hyperglycemia',
    icon: { name: 'syringe', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['emergency_room'],
    priority: 'high',
    searchKeywords: ['diabetes', 'diabetic coma', 'blood sugar', 'hypoglycemia']
  },
  {
    id: 'allergic_reaction',
    category: 'general',
    name: 'Severe Allergic Reaction',
    description: 'Anaphylaxis, severe allergic reaction',
    icon: { name: 'allergies', library: 'FontAwesome5' },
    requiredAmbulanceTypes: ['bls', 'als'],
    requiredHospitalServices: ['emergency_room'],
    priority: 'critical',
    searchKeywords: ['allergy', 'anaphylaxis', 'allergic reaction', 'swelling']
  }
];

export const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  {
    id: 'cardiac',
    name: 'Heart & Circulation',
    icon: { name: 'heartbeat', library: 'FontAwesome5' },
    color: '#ef4444',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'cardiac')
  },
  {
    id: 'trauma',
    name: 'Trauma & Injuries',
    icon: { name: 'user-injured', library: 'FontAwesome5' },
    color: '#dc2626',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'trauma')
  },
  {
    id: 'respiratory',
    name: 'Breathing Problems',
    icon: { name: 'lungs', library: 'FontAwesome5' },
    color: '#2563eb',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'respiratory')
  },
  {
    id: 'neurological',
    name: 'Brain & Nervous System',
    icon: { name: 'brain', library: 'FontAwesome5' },
    color: '#7c3aed',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'neurological')
  },
  {
    id: 'pediatric',
    name: 'Child Emergencies',
    icon: { name: 'child', library: 'FontAwesome5' },
    color: '#059669',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'pediatric')
  },
  {
    id: 'obstetric',
    name: 'Pregnancy & Delivery',
    icon: { name: 'female', library: 'FontAwesome' },
    color: '#db2777',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'obstetric')
  },
  {
    id: 'psychiatric',
    name: 'Mental Health',
    icon: { name: 'brain', library: 'FontAwesome5' },
    color: '#0891b2',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'psychiatric')
  },
  {
    id: 'burns',
    name: 'Burns',
    icon: { name: 'fire', library: 'FontAwesome5' },
    color: '#ea580c',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'burns')
  },
  {
    id: 'poisoning',
    name: 'Poisoning & Overdose',
    icon: { name: 'skull-crossbones', library: 'FontAwesome5' },
    color: '#374151',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'poisoning')
  },
  {
    id: 'general',
    name: 'General Medical',
    icon: { name: 'exclamation-triangle', library: 'FontAwesome5' },
    color: '#6b7280',
    emergencies: EMERGENCY_TYPES.filter(e => e.category === 'general')
  }
];
