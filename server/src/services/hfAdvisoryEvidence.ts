/**
 * Hugging Face advisory evidence layer
 *
 * Dataset:
 * me-nabi/hindikrishi-farmer-advisory-dataset
 *
 * This dataset provides supplementary advisory evidence.
 * It is NOT an authoritative fertilizer prescription.
 */

export interface HfAdvisoryEvidence {
  id?: string;
  crop: string;
  instruction: string;
  advisory: string;
  matchedTerms: string[];
  hasDose?: boolean;
  source: {
    name: string;
    datasetId: string;
    verificationStatus: 'unverified';
  };
}

export const HF_ADVISORY_SOURCE = {
  name: 'HindiKrishi Farmer Advisory Dataset',
  datasetId: 'me-nabi/hindikrishi-farmer-advisory-dataset',
  verificationStatus: 'unverified' as const,
};

export { HF_ADVISORY_EVIDENCE_GENERATED } from './hfAdvisoryEvidence.generated.js';


