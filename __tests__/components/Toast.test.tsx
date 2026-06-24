import { ToastProvider,useToast } from '@/components/ui/Toast';
import { act,render,screen } from '@testing-library/react';

function TestConsumer() {
  const { toast } = useToast();
  return <button onClick={() => toast({ type: 'success', message: 'Success!' })}>Show Toast</button>;
}

describe('Toast', () => {
  it('renders provider and consumer', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    expect(screen.getByText('Show Toast')).toBeInTheDocument();
  });

  it('shows toast message when triggered', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    act(() => {
      screen.getByText('Show Toast').click();
    });
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
