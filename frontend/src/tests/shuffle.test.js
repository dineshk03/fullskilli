import { describe, expect, it, vi } from 'vitest';
import { shuffleDifferent } from '../utils/shuffleDifferent';
import { shuffleMatchingOptions } from '../utils/quizShuffler';

describe('matching options cannot hang on small inputs', () => {
  it('handles empty and single-answer questions', () => {
    expect(shuffleDifferent([])).toEqual([]);
    expect(shuffleDifferent(['one'])).toEqual(['one']);
    expect(shuffleMatchingOptions(['one'])).toEqual([{ text: 'one', originalIndex: 0, displayIndex: 0 }]);
  });
  it('terminates even if randomness repeatedly produces the same permutation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const original = ['first', 'second', 'third'];
    expect(shuffleDifferent(original)).not.toEqual(original);
    expect(original).toEqual(['first', 'second', 'third']);
  });
});
