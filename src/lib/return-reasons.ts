export const RETURN_REASONS = [
  { value: 'WRONG_SIZE', label: 'Wrong size / does not fit' },
  { value: 'DEFECTIVE', label: 'Defective or damaged item' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described on the website' },
  { value: 'CHANGED_MIND', label: 'Changed mind / no longer needed' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ReturnReasonCode = (typeof RETURN_REASONS)[number]['value'];

export function isValidReturnReason(value: string): value is ReturnReasonCode {
  return RETURN_REASONS.some((r) => r.value === value);
}
