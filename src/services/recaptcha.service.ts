import axios from 'axios';
import { config } from '../config/environment';

/**
 * Google reCAPTCHA v2 驗證回應介面
 */
export interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * reCAPTCHA 服務類別
 * 處理 Google reCAPTCHA v2 驗證
 */
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly verifyUrl: string;
  private readonly enabled: boolean;

  constructor() {
    this.secretKey = config.RECAPTCHA_SECRET_KEY;
    this.verifyUrl = config.RECAPTCHA_VERIFY_URL;
    this.enabled = config.RECAPTCHA_ENABLED;
  }

  /**
   * 驗證 reCAPTCHA 回應
   * @param token - 從前端接收的 reCAPTCHA token
   * @param remoteIp - 使用者的 IP 位址（可選）
   * @returns 驗證結果
   */
  async verify(token: string, remoteIp?: string): Promise<RecaptchaVerifyResponse> {
    // 如果 reCAPTCHA 未啟用，直接返回成功
    if (!this.enabled) {
      console.log('reCAPTCHA is disabled, bypassing verification');
      return { success: true };
    }

    // 檢查 token 是否存在
    if (!token) {
      console.error('reCAPTCHA token is missing');
      return {
        success: false,
        'error-codes': ['missing-input-response']
      };
    }

    try {
      // 準備驗證參數
      const params = new URLSearchParams();
      params.append('secret', this.secretKey);
      params.append('response', token);

      // 如果有提供 IP，加入參數
      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }

      // 發送驗證請求到 Google
      const response = await axios.post<RecaptchaVerifyResponse>(
        this.verifyUrl,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 5000, // 5 秒超時
        }
      );

      // 記錄驗證結果
      if (response.data.success) {
        console.log('reCAPTCHA verification successful');
      } else {
        console.warn('reCAPTCHA verification failed:', response.data['error-codes']);
      }

      return response.data;
    } catch (error: any) {
      console.error('reCAPTCHA verification error:', error.message);

      // 網路錯誤或其他異常
      return {
        success: false,
        'error-codes': ['network-error'],
      };
    }
  }

  /**
   * 檢查 reCAPTCHA 是否啟用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 取得 Site Key（前端使用）
   */
  getSiteKey(): string {
    return config.RECAPTCHA_SITE_KEY;
  }

  /**
   * 解析錯誤碼為使用者友善的訊息
   */
  getErrorMessage(errorCodes?: string[]): string {
    if (!errorCodes || errorCodes.length === 0) {
      return '驗證失敗，請重試';
    }

    const errorMessages: Record<string, string> = {
      'missing-input-secret': '缺少密鑰參數',
      'invalid-input-secret': '密鑰無效或格式錯誤',
      'missing-input-response': '請完成人機驗證',
      'invalid-input-response': '驗證回應無效或已過期',
      'bad-request': '請求格式錯誤',
      'timeout-or-duplicate': '驗證超時或重複提交',
      'network-error': '網路連線錯誤，請稍後再試',
    };

    // 找出第一個已知的錯誤訊息
    for (const code of errorCodes) {
      if (errorMessages[code]) {
        return errorMessages[code];
      }
    }

    return '驗證失敗，請重試';
  }
}

// 單例實例
export const recaptchaService = new RecaptchaService();