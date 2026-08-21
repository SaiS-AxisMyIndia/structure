const userService = require('../../src/core/user/user_service');

describe('userService', () => {
  describe('getAll', () => {
    it('should return a list of users', async () => {
      const users = await userService.getAll();
      expect(Array.isArray(users)).toBe(true);
    });
  });
});
