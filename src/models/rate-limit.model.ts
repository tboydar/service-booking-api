import { DataTypes, Model, Optional } from 'sequelize';
import { Sequelize } from 'sequelize';

/**
 * Rate limit attributes interface
 */
export interface RateLimitAttributes {
  key: string;
  points: number;
  expire: bigint | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Rate limit creation attributes (for new records)
 */
export interface RateLimitCreationAttributes
  extends Optional<RateLimitAttributes, 'expire' | 'createdAt' | 'updatedAt'> {}

/**
 * Rate limit model class
 */
export class RateLimit
  extends Model<RateLimitAttributes, RateLimitCreationAttributes>
  implements RateLimitAttributes {
  public key!: string;
  public points!: number;
  public expire!: bigint | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Initialize the RateLimit model
   */
  public static initModel(sequelize: Sequelize): typeof RateLimit {
    RateLimit.init(
      {
        key: {
          type: DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        points: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        expire: {
          type: DataTypes.BIGINT,
          allowNull: true,
          get() {
            const value = this.getDataValue('expire');
            return value !== null ? BigInt(value) : null;
          },
          set(value: bigint | number | null) {
            if (value !== null) {
              this.setDataValue('expire', value.toString() as any);
            } else {
              this.setDataValue('expire', null);
            }
          },
        },
      },
      {
        sequelize,
        modelName: 'RateLimit',
        tableName: 'rate_limits',
        timestamps: true,
        indexes: [
          {
            name: 'idx_expire',
            fields: ['expire'],
          },
        ],
      }
    );

    return RateLimit;
  }

  /**
   * Clean up expired records
   */
  public static async cleanExpired(): Promise<number> {
    const now = Date.now();
    const result = await RateLimit.destroy({
      where: {
        expire: {
          [require('sequelize').Op.lt]: now,
          [require('sequelize').Op.not]: null,
        } as any,
      },
    });
    return result;
  }
}

export default RateLimit;