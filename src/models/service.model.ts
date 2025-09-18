import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';

export class Service extends Model {
  public id!: string;
  public name!: string;
  public description!: string;
  public price!: number;
  public duration!: number;
  public isActive!: boolean;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Service',
    tableName: 'Services',
    timestamps: true,
  }
);

export default Service;