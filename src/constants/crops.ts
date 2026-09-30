export const ALL_CROPS_LIST: string[] = [
  'Cotton',
  'Soybean',
  'Sugarcane',
  'Rice',
  'Wheat',
  'Tomato',
  'Chickpea (Chana)',
  'Onion',
  'Potato',
  'Maize',
  'Banana',
  'Mango',
  'Tur (Pigeon Pea)',
  'Jowar (Sorghum)',
  'Bajra (Pearl Millet)',
  'Groundnut',
  'Brinjal',
  'Chili',
  'Grape',
  'Pomegranate',
];

export const ALL_CROPS_CONFIG = ALL_CROPS_LIST.map((name) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''),
  name,
}));
