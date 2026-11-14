export function logoPlacement(data, role) {
  const defaults = data.layout === 'workshop'
    ? { academy: [28, 22, 150, 94], college: [850, 22, 120, 94] }
    : data.layout === 'ramnad'
      ? { academy: [92, 65, 140, 65], college: [833, 65, 75, 65] }
      : data.layout === 'saEngg'
        ? { academy: [455, 24, 90, 92], college: [876, 48, 66, 60] }
      : { academy: [58, 48, 66, 60], college: [876, 48, 66, 60] };
  defaults.third = [Math.round((1000 - (data.thirdLogoWidth ?? 120)) / 2), 22, 120, 60];
  return Object.fromEntries(['X', 'Y', 'Width', 'Height'].map((key, index) => [key, data[`${role}Logo${key}`] ?? defaults[role][index]]));
}


// Reserve a separate row when a visible top logo crosses the central text column.
export function certificateHeaderTop(data, collaboration, originalTop, textLeft, textRight) {
  let top = originalTop;
  for (const role of ['academy', 'college', 'third']) {
    if (data[`show${role[0].toUpperCase()}${role.slice(1)}Logo`] === false) continue;
    if (role === 'college' && (!collaboration || !data.collegeLogoUrl)) continue;
    if (role === 'third' && !data.thirdLogoUrl) continue;
    const logo = logoPlacement(data, role);
    if (logo.Y < 200 && logo.X < textRight && logo.X + logo.Width > textLeft) {
      top = Math.max(top, logo.Y + logo.Height + 12);
    }
  }
  return top;
}
