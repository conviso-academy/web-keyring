const MOCK_DELAY = () => Math.random() * 500 + 300;

export async function mockDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, MOCK_DELAY()));
}
