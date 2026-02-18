import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('wizard e2e-ish happy path', () => {
  it('lets user complete flow and see final stats', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Player|玩家/i }));
    await user.type(screen.getByLabelText(/Name|姓名/i), 'Aric');
    await user.click(screen.getByRole('button', { name: /Next|下一步/i }));

    const strInput = screen.getByLabelText('STR');
    await user.clear(strInput);
    await user.type(strInput, '16');

    await user.click(screen.getByRole('button', { name: /Next|下一步/i }));
    await user.click(screen.getByLabelText('Human'));
    await user.click(screen.getByRole('button', { name: /Next|下一步/i }));
    await user.click(screen.getByLabelText('Fighter (Level 1)'));
    await user.click(screen.getByRole('button', { name: /Next|下一步/i }));
    await user.click(screen.getByLabelText('Power Attack'));
    await user.click(screen.getByRole('button', { name: /Next|下一步/i }));
    await user.click(screen.getByLabelText('Chainmail'));
    await user.click(screen.getByLabelText('Heavy Wooden Shield'));
    await user.click(screen.getByRole('button', { name: /Next|下一步/i }));

    expect(screen.getByText(/Review|总览/i)).toBeTruthy();
    expect(screen.getByText(/AC:/).textContent).toContain('BAB: 1');
  });
});
