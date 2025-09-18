import { User } from '../models';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async create(userData: any): Promise<User> {
    return User.create(userData);
  }

  async count(): Promise<number> {
    return User.count();
  }
}