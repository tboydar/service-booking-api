import { UserRepository } from '../user-repository';
import { User } from '../../models/user';
import { sequelize } from '../../config/database';
import type { UserCreationAttributes } from '../../types/user.types';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeAll(async () => {
    // 確保資料庫連接已建立
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    userRepository = new UserRepository();
    // 清空測試資料
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('create', () => {
    it('應該成功建立新使用者', async () => {
      const userData: UserCreationAttributes = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.password).toBe(userData.password);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('當 email 重複時應該拋出錯誤', async () => {
      const userData: UserCreationAttributes = {
        email: 'duplicate@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
      };

      await userRepository.create(userData);

      await expect(userRepository.create(userData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('應該根據 ID 找到使用者', async () => {
      const userData: UserCreationAttributes = {
        email: 'findbyid@example.com',
        password: 'hashedPassword123',
        name: 'Find By ID User',
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe(userData.email);
    });

    it('當使用者不存在時應該回傳 null', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const foundUser = await userRepository.findById(nonExistentId);

      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('應該根據 email 找到使用者', async () => {
      const userData: UserCreationAttributes = {
        email: 'findbyemail@example.com',
        password: 'hashedPassword123',
        name: 'Find By Email User',
      };

      await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser!.email).toBe(userData.email);
      expect(foundUser!.name).toBe(userData.name);
    });

    it('當 email 不存在時應該回傳 null', async () => {
      const foundUser = await userRepository.findByEmail(
        'nonexistent@example.com'
      );

      expect(foundUser).toBeNull();
    });
  });

  describe('findAll', () => {
    it('應該回傳所有使用者', async () => {
      const users = [
        {
          email: 'user1@example.com',
          password: 'hashedPassword123',
          name: 'User 1',
        },
        {
          email: 'user2@example.com',
          password: 'hashedPassword123',
          name: 'User 2',
        },
      ];

      await Promise.all(users.map(user => userRepository.create(user)));
      const foundUsers = await userRepository.findAll();

      expect(foundUsers).toHaveLength(2);
      expect(foundUsers[0]?.createdAt.getTime()).toBeGreaterThanOrEqual(
        foundUsers[1]?.createdAt.getTime() || 0
      );
    });

    it('當沒有使用者時應該回傳空陣列', async () => {
      const foundUsers = await userRepository.findAll();

      expect(foundUsers).toHaveLength(0);
    });
  });

  describe('updateById', () => {
    it('應該成功更新使用者資料', async () => {
      const userData: UserCreationAttributes = {
        email: 'update@example.com',
        password: 'hashedPassword123',
        name: 'Original Name',
      };

      const createdUser = await userRepository.create(userData);
      const updateData = { name: 'Updated Name' };
      const updatedUser = await userRepository.updateById(
        createdUser.id,
        updateData
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.name).toBe('Updated Name');
      expect(updatedUser!.email).toBe(userData.email);
    });

    it('當使用者不存在時應該回傳 null', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updatedUser = await userRepository.updateById(nonExistentId, {
        name: 'New Name',
      });

      expect(updatedUser).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('應該成功刪除使用者', async () => {
      const userData: UserCreationAttributes = {
        email: 'delete@example.com',
        password: 'hashedPassword123',
        name: 'Delete User',
      };

      const createdUser = await userRepository.create(userData);
      const deleted = await userRepository.deleteById(createdUser.id);

      expect(deleted).toBe(true);

      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('當使用者不存在時應該回傳 false', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const deleted = await userRepository.deleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('當 email 存在時應該回傳 true', async () => {
      const userData: UserCreationAttributes = {
        email: 'exists@example.com',
        password: 'hashedPassword123',
        name: 'Exists User',
      };

      await userRepository.create(userData);
      const exists = await userRepository.emailExists(userData.email);

      expect(exists).toBe(true);
    });

    it('當 email 不存在時應該回傳 false', async () => {
      const exists = await userRepository.emailExists('notexists@example.com');

      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('應該回傳正確的使用者數量', async () => {
      const users = [
        {
          email: 'count1@example.com',
          password: 'hashedPassword123',
          name: 'Count User 1',
        },
        {
          email: 'count2@example.com',
          password: 'hashedPassword123',
          name: 'Count User 2',
        },
        {
          email: 'count3@example.com',
          password: 'hashedPassword123',
          name: 'Count User 3',
        },
      ];

      await Promise.all(users.map(user => userRepository.create(user)));
      const count = await userRepository.count();

      expect(count).toBe(3);
    });

    it('當沒有使用者時應該回傳 0', async () => {
      const count = await userRepository.count();

      expect(count).toBe(0);
    });
  });
});
