import { describe, it, expect, vi } from 'vitest';
import { verifySlack } from '../middleware/verifySlack';

describe('verifySlack middleware', () => {
  it('should reject requests without signature', async () => {
    const mockContext = {
      req: {
        header: vi.fn().mockReturnValue(undefined),
      },
      text: vi.fn().mockReturnValue({ status: 401 }),
    };
    const mockNext = vi.fn();

    const result = await verifySlack(mockContext as any, mockNext);

    expect(mockContext.text).toHaveBeenCalledWith('Bad signature', 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject stale requests', async () => {
    const mockContext = {
      req: {
        header: vi
          .fn()
          .mockReturnValueOnce('v0=signature')
          .mockReturnValueOnce((Date.now() / 1000 - 400).toString()),
      },
      text: vi.fn().mockReturnValue({ status: 401 }),
    };
    const mockNext = vi.fn();

    const result = await verifySlack(mockContext as any, mockNext);

    expect(mockContext.text).toHaveBeenCalledWith('Stale request', 401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
