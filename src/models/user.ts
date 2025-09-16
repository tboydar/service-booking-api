import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';
import type { UserAttributes } from '../types/user.types';

/**
 * User model class extending Sequelize Model
 */
export class User
  extends Model<InferAttributes<User>, InferCreationAttributes<User>>
  implements UserAttributes
{
  declare id: string;
  declare email: string;
  declare password: string;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /**
   * Convert User instance to response format (without sensitive data)
   */
  toResponseFormat(): {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Initialize User model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Email must be a valid email address',
        },
        len: {
          args: [1, 255],
          msg: 'Email must be between 1 and 255 characters',
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters long',
        },
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [2, 255],
          msg: 'Name must be between 2 and 255 characters',
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'users_email_unique',
      },
      {
        fields: ['email'],
        name: 'users_email_index',
      },
    ],
  }
);

export default User;
