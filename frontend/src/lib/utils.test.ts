import { countrySlug, decodeSlug, capitalize } from './utils';

describe('countrySlug', () => {
  it('should slugify a country name', () => {
    expect(countrySlug('North America')).toBe('north-america');
    expect(countrySlug('United States')).toBe('united-states');
    expect(countrySlug('Albania')).toBe('albania');
  });
  it('should handle special characters', () => {
    expect(countrySlug('Côte d\'Ivoire')).toBe('cote-divoire');
  });
  it('should return empty string for empty input', () => {
    expect(countrySlug('')).toBe('');
  });
});

describe('decodeSlug', () => {
  it('should decode a slug to capitalized words', () => {
    expect(decodeSlug('north-america')).toBe('North America');
    expect(decodeSlug('united-states')).toBe('United States');
    expect(decodeSlug('albania')).toBe('Albania');
  });
  it('should handle empty string', () => {
    expect(decodeSlug('')).toBe('');
  });
});

describe('capitalize', () => {
  it('should capitalize the first letter', () => {
    expect(capitalize('europe')).toBe('Europe');
    expect(capitalize('albania')).toBe('Albania');
  });
  it('should handle empty string', () => {
    expect(capitalize('')).toBe('');
  });
  it('should not change already capitalized', () => {
    expect(capitalize('Europe')).toBe('Europe');
  });
}); 