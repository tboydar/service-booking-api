import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';
import type { AppointmentServiceAttributes } from '../types/appointment-service.types';

/**
 * AppointmentService model class extending Sequelize Model
 */
export class AppointmentService
  extends Model<
    InferAttributes<AppointmentService>,
    InferCreationAttributes<AppointmentService>
  >
  implements AppointmentServiceAttributes
{
  declare id: string;
  declare name: string;
  declare description: CreationOptional<string>;
  declare price: number;
  declare showTime: CreationOptional<number>;
  declare order: CreationOptional<number>;
  declare isRemove: CreationOptional<boolean>;
  declare isPublic: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /**
   * Scope to get only public and non-removed services
   */
  static getPublicServices() {
    return this.findAll({
      where: {
        isPublic: true,
        isRemove: false,
      },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  /**
   * Scope to get service by ID if it's public and not removed
   */
  static getPublicServiceById(id: string) {
    return this.findOne({
      where: {
        id,
        isPublic: true,
        isRemove: false,
      },
    });
  }

  /**
   * Soft delete the service
   */
  async softDelete() {
    this.isRemove = true;
    await this.save();
  }
}

// Initialize AppointmentService model
AppointmentService.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [1, 255],
          msg: 'Service name must be between 1 and 255 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Description must not exceed 1000 characters',
        },
      },
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Price must be a non-negative integer',
        },
        isInt: {
          msg: 'Price must be an integer (in cents)',
        },
      },
    },
    showTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Show time must be a non-negative integer',
        },
        isInt: {
          msg: 'Show time must be an integer',
        },
      },
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Order must be a non-negative integer',
        },
        isInt: {
          msg: 'Order must be an integer',
        },
      },
    },
    isRemove: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: 'AppointmentService',
    tableName: 'AppointmentServices',
    timestamps: true,
    indexes: [
      {
        fields: ['order'],
        name: 'appointment_services_order_index',
      },
      {
        fields: ['isPublic', 'isRemove'],
        name: 'appointment_services_public_remove_index',
      },
      {
        fields: ['isRemove'],
        name: 'appointment_services_remove_index',
      },
    ],
  }
);

export default AppointmentService;
