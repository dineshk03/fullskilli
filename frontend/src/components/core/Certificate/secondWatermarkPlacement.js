export const secondWatermarkPlacement = data => ({
  x: data.secondWatermarkX ?? 380,
  y: data.secondWatermarkY ?? 230,
  width: data.secondWatermarkWidth ?? 240,
  height: data.secondWatermarkHeight ?? 240,
  opacity: data.secondWatermarkOpacity ?? 0.08,
});
