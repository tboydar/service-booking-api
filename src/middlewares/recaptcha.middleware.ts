import { Context, Next } from 'koa';
import { recaptchaService } from '../services/recaptcha.service';
import { AppError } from './error-handler';

/**
 * reCAPTCHA v2 驗證中介軟體
 * 驗證請求中的 reCAPTCHA token
 */
export const recaptchaMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  // 如果 reCAPTCHA 未啟用，直接通過
  if (!recaptchaService.isEnabled()) {
    return await next();
  }

  // 從請求中取得 reCAPTCHA token
  const token = (ctx.request.body as any)?.['g-recaptcha-response'] ||
                (ctx.request.body as any)?.recaptchaToken ||
                ctx.request.headers['x-recaptcha-token'] as string;

  // 檢查 token 是否存在
  if (!token) {
    throw new AppError(
      'RECAPTCHA_REQUIRED',
      '請完成人機驗證',
      400,
      {
        field: 'recaptcha',
        reason: 'missing_token',
      }
    );
  }

  // 取得使用者 IP（用於額外驗證）
  const remoteIp = ctx.request.ip ||
                   ctx.request.headers['x-forwarded-for'] as string ||
                   ctx.request.headers['x-real-ip'] as string;

  try {
    // 驗證 reCAPTCHA token
    const result = await recaptchaService.verify(token, remoteIp);

    if (!result.success) {
      // 驗證失敗
      const errorMessage = recaptchaService.getErrorMessage(result['error-codes']);

      throw new AppError(
        'RECAPTCHA_FAILED',
        errorMessage,
        400,
        {
          field: 'recaptcha',
          errors: result['error-codes'],
        }
      );
    }

    // 驗證成功，將結果附加到 context 供後續使用
    (ctx as any).recaptcha = {
      verified: true,
      timestamp: result.challenge_ts,
      hostname: result.hostname,
    };

    // 繼續處理請求
    await next();
  } catch (error) {
    // 如果已經是 AppError，直接拋出
    if (error instanceof AppError) {
      throw error;
    }

    // 其他錯誤，包裝成 AppError
    console.error('reCAPTCHA middleware error:', error);
    throw new AppError(
      'RECAPTCHA_ERROR',
      '人機驗證服務暫時無法使用，請稍後再試',
      503,
      {
        field: 'recaptcha',
        reason: 'service_error',
      }
    );
  }
};

/**
 * 選擇性的 reCAPTCHA 驗證中介軟體
 * 如果有提供 token 則驗證，沒有則通過
 */
export const optionalRecaptchaMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  // 如果 reCAPTCHA 未啟用，直接通過
  if (!recaptchaService.isEnabled()) {
    return await next();
  }

  // 檢查是否有提供 token
  const token = (ctx.request.body as any)?.['g-recaptcha-response'] ||
                (ctx.request.body as any)?.recaptchaToken ||
                ctx.request.headers['x-recaptcha-token'] as string;

  // 如果有提供 token，則進行驗證
  if (token) {
    return await recaptchaMiddleware(ctx, next);
  }

  // 沒有提供 token，記錄並通過
  console.warn('reCAPTCHA token not provided, proceeding without verification');
  (ctx as any).recaptcha = {
    verified: false,
    skipped: true,
  };

  await next();
};

/**
 * 開發環境的 reCAPTCHA 中介軟體
 * 在開發環境中可以跳過驗證
 */
export const devRecaptchaMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  // 在開發環境且有特殊標記時跳過
  if (process.env['NODE_ENV'] === 'development' &&
      ctx.request.headers['x-skip-recaptcha'] === 'true') {
    console.log('Skipping reCAPTCHA in development mode');
    (ctx as any).recaptcha = {
      verified: true,
      skipped: true,
      reason: 'development_mode',
    };
    return await next();
  }

  // 否則使用正常驗證
  return await recaptchaMiddleware(ctx, next);
};