const authService = require('../../src/core/auth/auth_service');

describe('authService', () => {
  describe('register', () => {
    it('should register a new user', async () => {
      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
