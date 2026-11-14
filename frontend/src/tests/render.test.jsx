import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocumentViewer from '../components/core/ViewCourse/DocumentViewer';
import SlideViewer from '../components/core/ViewCourse/SlideViewer';
import MobileProfileDropDown from '../components/core/Auth/MobileProfileDropDown';
import Dashboard from '../pages/Dashboard';
import PlanStatusCard from '../components/core/PlanStatusCard';

const { state, dispatch } = vi.hoisted(() => ({ state: {
  profile: { user: null, loading: true }, auth: { loading: true, token: null }
}, dispatch: vi.fn() }));
vi.mock('react-redux', () => ({ useSelector: selector => selector(state), useDispatch: () => dispatch }));
vi.mock('../services/operations/courseDetailsAPI', () => ({ fetchCourseCategories: async () => [] }));
vi.mock('../components/core/Dashboard/Sidebar', () => ({ default: () => <nav aria-label="Dashboard navigation" /> }));
vi.mock('../services/operations/authAPI', () => ({ logout: () => ({ type: 'logout' }) }));

afterEach(cleanup);
beforeEach(() => {
  state.profile = { user: null, loading: true };
  state.auth = { loading: true, token: null };
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

describe('components preserve Hook ordering when data becomes available', () => {
  it('renders documents after an initially empty response', () => {
    const { container, rerender } = render(<DocumentViewer />);
    expect(container.innerHTML).toBe('');
    rerender(<DocumentViewer pdfUrl="https://example.com/lesson.pdf" />);
    expect(screen.getByText('Course Materials')).toBeTruthy();
    expect(screen.getAllByTitle('PDF Document')[0].getAttribute('src')).toContain('lesson.pdf');
    rerender(<DocumentViewer />);
    expect(container.innerHTML).toBe('');
  });

  it('registers keyboard navigation before presentation fallback returns', () => {
    const { rerender } = render(<SlideViewer slides={[]} pptUrl="https://example.com/slides.pptx" />);
    rerender(<SlideViewer slides={['https://example.com/1.png', 'https://example.com/2.png']} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getAllByAltText('Slide 2')[0].getAttribute('src')).toBe('https://example.com/2.png');
    rerender(<SlideViewer slides={[]} />);
    expect(screen.getByText('PowerPoint Presentation')).toBeTruthy();
  });

  it('supports profile login and logout transitions', () => {
    const { container, rerender } = render(<MemoryRouter><MobileProfileDropDown /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
    state.profile.user = { firstName: 'Student', image: 'https://example.com/avatar.png' };
    rerender(<MemoryRouter><MobileProfileDropDown /></MemoryRouter>);
    expect(screen.getByAltText('profile-Student')).toBeTruthy();
    state.profile.user = null;
    rerender(<MemoryRouter><MobileProfileDropDown /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
  });

  it('transitions from dashboard loading to ready', () => {
    const { rerender } = render(<MemoryRouter><Dashboard /></MemoryRouter>);
    state.profile.loading = false;
    state.auth.loading = false;
    rerender(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Dashboard navigation' })).toBeTruthy();
  });

  it('renders plan usage totals from the repaired JSX expression', () => {
    render(<PlanStatusCard plan={{ plan_name: 'Learning Plan', status: 'ACTIVE',
      skill_tests: { used: 2, total: 10 }, courses: { used: 3, total: 10 },
      virtual_internship: { used: 1, total: 10 } }} showValidity={false} />);
    expect(screen.getByText(/6.*uses total/)).toBeTruthy();
  });
});
