import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('wizard e2e-ish happy path', () => {
  it('lets user complete flow and see final stats', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Open the scroll|展开卷轴/i }));
    await user.click(screen.getByRole('tab', { name: /Player/i }));
    await user.type(screen.getByPlaceholderText('Enter character name'), 'Aric');
    await user.click(screen.getByText('Next'));

    const strInput = screen.getByLabelText('STR');
    await user.clear(strInput);
    await user.type(strInput, '16');

    await user.click(screen.getByText('Next'));
    await user.click(screen.getByLabelText('Human'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByLabelText('Fighter (Level 1)'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByLabelText('Power Attack'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByLabelText('Chainmail'));
    await user.click(screen.getByLabelText('Heavy Wooden Shield'));
    await user.click(screen.getByText('Next'));

    expect(screen.getByText('Review')).toBeTruthy();
    expect(screen.getByText(/AC:/).textContent).toContain('BAB: 1');
  });
});
