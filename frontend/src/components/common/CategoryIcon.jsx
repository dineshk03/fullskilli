/* eslint-disable react/prop-types -- Category icon names are resolved against the icon library. */
import { categoryIcons } from './categoryIconRegistry';

export default function CategoryIcon({ name, className }) {
  const Icon = typeof name === 'string' && Object.prototype.hasOwnProperty.call(categoryIcons, name)
    ? categoryIcons[name]
    : categoryIcons.FaBook;
  return <Icon className={className} />;
}
