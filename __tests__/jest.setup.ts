// Jest setup — global test configuration
beforeAll(() => {
  // Suppress console output during tests if needed
  // jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  // Cleanup
});

// Custom matchers can go here if needed
expect.extend({
  // Example: custom matcher for economic data validation
  toBeValidConfidence(received) {
    const valid = ['high', 'medium', 'low'].includes(received);
    return {
      message: () => `expected ${received} to be a valid confidence level`,
      pass: valid,
    };
  },
});
