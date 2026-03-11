import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Users } from 'lucide-react';
import KpiCard from '../components/common/KpiCard';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Total Sarees" value={42} icon={Users} />);
    expect(screen.getByText('Total Sarees')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('shows skeleton when loading', () => {
    const { container } = render(<KpiCard title="X" value={0} icon={Users} loading />);
    expect(container.querySelector('.skeleton')).toBeTruthy();
  });
});
