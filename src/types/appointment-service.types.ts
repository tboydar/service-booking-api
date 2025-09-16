/**
 * AppointmentService related type definitions
 */

/**
 * AppointmentService attributes interface
 */
export interface AppointmentServiceAttributes {
  id: string; // UUID 主鍵
  name: string; // 服務名稱
  description?: string; // 服務描述
  price: number; // 價格 (整數，以分為單位)
  showTime?: number; // 顯示時間
  order: number; // 排序 (預設 0)
  isRemove: boolean; // 軟刪除標記 (預設 false)
  isPublic: boolean; // 是否公開 (預設 true)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AppointmentService creation attributes (without auto-generated fields)
 */
export interface AppointmentServiceCreationAttributes {
  id?: string; // Optional, will be auto-generated if not provided
  name: string;
  description?: string;
  price: number;
  showTime?: number;
  order?: number; // Default: 0
  isRemove?: boolean; // Default: false
  isPublic?: boolean; // Default: true
}

/**
 * Service creation DTO
 */
export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  showTime?: number;
  order?: number;
  isPublic?: boolean;
}

/**
 * Service update DTO
 */
export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  showTime?: number;
  order?: number;
  isPublic?: boolean;
}

/**
 * Service response DTO
 */
export interface ServiceResponse {
  success: true;
  data: AppointmentServiceAttributes;
  timestamp: string;
}

/**
 * Services list response DTO
 */
export interface ServicesListResponse {
  success: true;
  data: AppointmentServiceAttributes[];
  timestamp: string;
}
