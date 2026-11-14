import { shuffleDifferent } from './shuffleDifferent';

// Function to shuffle match-the-following options and ensure they don't match original order
export const shuffleMatchingOptions = (options) => {
  const indices = Array.from({ length: options.length }, (_, i) => i);
  const shuffledIndices = shuffleDifferent(indices);

  // Map the shuffled indices to create new array with original indices tracked
  return shuffledIndices.map((index, newIndex) => ({
    text: options[index],
    originalIndex: index,
    displayIndex: newIndex
  }));
};
