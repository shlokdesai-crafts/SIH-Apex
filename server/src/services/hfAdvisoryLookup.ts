import { HF_ADVISORY_EVIDENCE_GENERATED, type HfAdvisoryEvidence } from './hfAdvisoryEvidence.js';
import { normalizeCropName, getCropDisplayName } from './cropDataProvider.js';

const PRIMARY_NUTRIENT_TERMS = [
  'npk',
  'urea',
  'dap',
  'mop',
  'ssp',
  'potash',
  'fertilizer',
  'fertiliser',
  'उर्वरक',
  'खाद',
  'यूरिया',
  'डीएपी',
  'एनपीके',
  'पोटाश',
  'kg/ha',
  'kg/acre',
  'किलोग्राम',
  'नाइट्रोजन',
  'फास्फोरस',
  'पोटेशियम',
  'nutrient',
  'fym',
  'compost',
  'vermicompost',
  'zinc',
  'boron',
  'deficiency',
  'कमी',
  'खुराक',
  'मात्रा',
];

export function getHfAdvisoryEvidence(cropInput: string): HfAdvisoryEvidence[] {
  if (!cropInput) return [];

  const canonicalKey = normalizeCropName(cropInput);
  const canonicalDisplayName = getCropDisplayName(cropInput).toLowerCase();
  const rawInput = cropInput.trim().toLowerCase();

  return HF_ADVISORY_EVIDENCE_GENERATED
    .filter((item) => {
      const itemCrop = item.crop.trim().toLowerCase();
      const itemNorm = normalizeCropName(item.crop);

      return (
        itemNorm === canonicalKey ||
        itemCrop === canonicalDisplayName ||
        itemCrop === rawInput
      );
    })
    .map((item) => {
      const text = `${item.instruction} ${item.advisory}`.toLowerCase();

      // Base score from keyword presence
      let score = PRIMARY_NUTRIENT_TERMS.reduce(
        (total, term) => total + (text.includes(term) ? 2 : 0),
        0
      );

      // Boost items with confirmed dosage quantities
      if (item.hasDose) {
        score += 5;
      }

      // Boost if instruction explicitly mentions fertilizer or nutrients
      if (
        item.instruction.toLowerCase().includes('fertilizer') ||
        item.instruction.toLowerCase().includes('उर्वरक') ||
        item.instruction.toLowerCase().includes('खाद') ||
        item.instruction.toLowerCase().includes('पोषक')
      ) {
        score += 3;
      }

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }) => item);
}

