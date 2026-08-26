import { AppError } from '../services/errors/appError';

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage = 'Operation timeout'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AppError('TIMEOUT', timeoutMessage));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
