// e2e/helpers/profiles.ts
// Each profile maps a target DISC axis to the answer-option letter the UI uses.
// Option colors are positional (A=sky, B=amber, C=violet, D=emerald) and never reveal the axis,
// so profiles select by option index, not by axis name.
export type ProfileKey = 'dominant-D' | 'dominant-I' | 'dominant-S' | 'dominant-C';

// Index of the option to click on every question to push toward a given axis.
// Aligns with src/lib/profileResolver.ts mapping IMP->D, CON->I, SOS->S, EST->C.
export const PROFILE_OPTION_INDEX: Record<ProfileKey, number> = {
  'dominant-D': 0,
  'dominant-I': 1,
  'dominant-S': 2,
  'dominant-C': 3,
};
