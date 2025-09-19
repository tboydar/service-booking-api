import { User } from '../models/user';
import type { UserCreationAttributes } from '../types/user.types';

/**
 * User Repository class for handling user data operations
 */
export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: UserCreationAttributes): Promise<User> {
    return await User.create(userData as any);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await User.findByPk(id);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({
      where: { email },
    });
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    return await User.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Update user by ID
   */
  async updateById(
    id: string,
    updateData: Partial<UserCreationAttributes>
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    await user.update(updateData);
    return user;
  }

  /**
   * Delete user by ID (hard delete)
   */
  async deleteById(id: string): Promise<boolean> {
    const deletedCount = await User.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await User.findOne({
      where: { email },
      attributes: ['id'],
    });
    return user !== null;
  }

  /**
   * Get user count
   */
  async count(): Promise<number> {
    return await User.count();
  }
}

export default UserRepository;
