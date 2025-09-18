---
inclusion: fileMatch
fileMatchPattern: '*model*|*repository*|*migration*'
---

# 資料庫開發模式

## Sequelize 模型定義標準

### 基本模型結構
```typescript
import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare password: string;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'Users',
  timestamps: true
});
```

### 軟刪除模型
```typescript
export class AppointmentService extends Model<InferAttributes<AppointmentService>, InferCreationAttributes<AppointmentService>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: CreationOptional<string>;
  declare price: number;
  declare showTime: CreationOptional<number>;
  declare order: CreationOptional<number>;
  declare isRemove: CreationOptional<boolean>;
  declare isPublic: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AppointmentService.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  showTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isRemove: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'AppointmentService',
  tableName: 'AppointmentServices',
  timestamps: true,
  // 軟刪除設定
  defaultScope: {
    where: {
      isRemove: false
    }
  },
  scopes: {
    withDeleted: {
      where: {}
    },
    onlyDeleted: {
      where: {
        isRemove: true
      }
    }
  }
});
```

## Repository 模式實作

### 基礎 Repository 介面
```typescript
export interface BaseRepository<T> {
  findAll(options?: any): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### User Repository 實作
```typescript
import { injectable } from 'inversify';
import { User } from '../models/User';
import { BaseRepository } from './BaseRepository';

export interface UserRepository extends BaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}

@injectable()
export class SequelizeUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    return await User.findAll({
      attributes: { exclude: ['password'] }
    });
  }

  async findById(id: string): Promise<User | null> {
    return await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({
      where: { email }
    });
  }

  async create(userData: any): Promise<User> {
    const user = await User.create(userData);
    // 回傳時排除密碼
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword as User;
  }

  async update(id: string, userData: any): Promise<User> {
    await User.update(userData, {
      where: { id }
    });
    
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('使用者不存在');
    }
    
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const result = await User.destroy({
      where: { id }
    });
    
    if (result === 0) {
      throw new Error('使用者不存在');
    }
  }
}
```

### Service Repository 實作
```typescript
import { injectable } from 'inversify';
import { AppointmentService } from '../models/AppointmentService';
import { BaseRepository } from './BaseRepository';

export interface ServiceRepository extends BaseRepository<AppointmentService> {
  findPublicServices(): Promise<AppointmentService[]>;
  softDelete(id: string): Promise<void>;
}

@injectable()
export class SequelizeServiceRepository implements ServiceRepository {
  async findAll(): Promise<AppointmentService[]> {
    return await AppointmentService.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
  }

  async findPublicServices(): Promise<AppointmentService[]> {
    return await AppointmentService.findAll({
      where: {
        isPublic: true,
        isRemove: false
      },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
  }

  async findById(id: string): Promise<AppointmentService | null> {
    return await AppointmentService.findByPk(id);
  }

  async create(serviceData: any): Promise<AppointmentService> {
    return await AppointmentService.create(serviceData);
  }

  async update(id: string, serviceData: any): Promise<AppointmentService> {
    await AppointmentService.update(serviceData, {
      where: { id }
    });
    
    const updatedService = await this.findById(id);
    if (!updatedService) {
      throw new Error('服務不存在');
    }
    
    return updatedService;
  }

  async delete(id: string): Promise<void> {
    const result = await AppointmentService.destroy({
      where: { id }
    });
    
    if (result === 0) {
      throw new Error('服務不存在');
    }
  }

  async softDelete(id: string): Promise<void> {
    const result = await AppointmentService.update(
      { isRemove: true },
      { where: { id } }
    );
    
    if (result[0] === 0) {
      throw new Error('服務不存在');
    }
  }
}
```

## Migration 最佳實務

### 建立表格 Migration
```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('Users', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // 建立索引
    await queryInterface.addIndex('Users', ['email'], {
      name: 'users_email_idx',
      unique: true
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('Users');
  }
};
```

### 新增欄位 Migration
```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn('AppointmentServices', 'category', {
      type: DataTypes.STRING(100),
      allowNull: true,
      after: 'description'
    });

    // 新增索引
    await queryInterface.addIndex('AppointmentServices', ['category'], {
      name: 'appointment_services_category_idx'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex('AppointmentServices', 'appointment_services_category_idx');
    await queryInterface.removeColumn('AppointmentServices', 'category');
  }
};
```

## Seed 資料最佳實務

### User Seed
```typescript
import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        password: hashedPassword,
        name: '系統管理員',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'user@example.com',
        password: hashedPassword,
        name: '測試使用者',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('Users', {
      email: ['admin@example.com', 'user@example.com']
    });
  }
};
```

### Service Seed
```typescript
import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert('AppointmentServices', [
      {
        id: uuidv4(),
        name: '基礎諮詢服務',
        description: '提供基本的諮詢服務，適合初次使用者',
        price: 1000,
        showTime: 30,
        order: 1,
        isRemove: false,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '進階諮詢服務',
        description: '提供深度的專業諮詢服務',
        price: 2000,
        showTime: 60,
        order: 2,
        isRemove: false,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '專家一對一服務',
        description: '專家一對一深度諮詢服務',
        price: 5000,
        showTime: 90,
        order: 3,
        isRemove: false,
        isPublic: false, // 不公開的服務
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('AppointmentServices', {
      name: ['基礎諮詢服務', '進階諮詢服務', '專家一對一服務']
    });
  }
};
```

## 資料庫連接設定

### 資料庫設定檔
```typescript
import { Sequelize } from 'sequelize';
import path from 'path';

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    dialect: 'sqlite' as const,
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: console.log
  },
  test: {
    dialect: 'sqlite' as const,
    storage: ':memory:',
    logging: false
  },
  production: {
    dialect: 'sqlite' as const,
    storage: process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite'),
    logging: false
  }
};

export const sequelize = new Sequelize(config[env]);

// 測試資料庫連接
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('資料庫連接成功');
  } catch (error) {
    console.error('資料庫連接失敗:', error);
    throw error;
  }
}
```

## 查詢最佳化

### 使用索引
```typescript
// 在常用查詢欄位建立索引
await queryInterface.addIndex('AppointmentServices', ['isPublic', 'isRemove'], {
  name: 'appointment_services_public_remove_idx'
});

// 複合索引用於排序查詢
await queryInterface.addIndex('AppointmentServices', ['order', 'createdAt'], {
  name: 'appointment_services_order_created_idx'
});
```

### 避免 N+1 查詢
```typescript
// 錯誤：會產生 N+1 查詢
const users = await User.findAll();
for (const user of users) {
  const profile = await Profile.findOne({ where: { userId: user.id } });
}

// 正確：使用 include 一次查詢
const users = await User.findAll({
  include: [{ model: Profile }]
});
```

### 分頁查詢
```typescript
async findWithPagination(page: number = 1, limit: number = 10): Promise<{
  data: AppointmentService[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * limit;
  
  const { count, rows } = await AppointmentService.findAndCountAll({
    where: {
      isPublic: true,
      isRemove: false
    },
    order: [['order', 'ASC']],
    limit,
    offset
  });
  
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
}
```