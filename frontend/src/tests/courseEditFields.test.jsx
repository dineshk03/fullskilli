import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ChipInput from '../components/core/Dashboard/AddCourse/CourseInformation/ChipInput';
import RequirementsField from '../components/core/Dashboard/AddCourse/CourseInformation/RequirementField';

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ course: { course: null, editCourse: false } })
}));

afterEach(cleanup);

it('renders admin course tags and requirements without a Redux course', () => {
  const props = { register: vi.fn(), setValue: vi.fn(), errors: {} };
  render(<>
    <ChipInput {...props} name="tags" label="Tags" initialData={['JavaScript']} />
    <RequirementsField {...props} name="requirements" label="Requirements" initialData={['A computer']} />
  </>);
  expect(screen.getByText('JavaScript')).toBeTruthy();
  expect(screen.getByText('A computer')).toBeTruthy();
  expect(props.setValue).toHaveBeenCalledWith('tags', ['JavaScript']);
  expect(props.setValue).toHaveBeenCalledWith('requirements', ['A computer']);
});
