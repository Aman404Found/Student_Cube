import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const WINDOW = {
  second: 1000,
  minute: 60 * 1000,
  fifteenMinutes: 15 * 60 * 1000,
  hour: 60 * 60 * 1000,
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const ipKey = (req) => ipKeyGenerator(req.ip);

const userOrIpKey = (req, prefix) => {
  const userId = req.user?._id || req.user?.id;
  return userId ? `${prefix}:user:${userId}` : `${prefix}:ip:${ipKey(req)}`;
};

const createLimiter = ({ windowMs, max, message, keyGenerator }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
    keyGenerator,
  });

const createServiceLimiter = ({ prefix, max, message }) => createLimiter({
  windowMs: WINDOW.second,
  max,
  message,
  keyGenerator: (req) => userOrIpKey(req, prefix),
});

export const authServiceLimiter = createServiceLimiter({
  prefix: 'auth-service',
  max: 15,
  message: 'Too many auth requests. Please slow down.',
});

export const productServiceLimiter = createServiceLimiter({
  prefix: 'product-service',
  max: 15,
  message: 'Too many product requests. Please slow down.',
});

export const offerServiceLimiter = createServiceLimiter({
  prefix: 'offer-service',
  max: 15,
  message: 'Too many offer requests. Please slow down.',
});

export const paymentServiceLimiter = createServiceLimiter({
  prefix: 'payment-service',
  max: 15,
  message: 'Too many payment requests. Please slow down.',
});

export const ambassadorServiceLimiter = createServiceLimiter({
  prefix: 'ambassador-service',
  max: 15,
  message: 'Too many ambassador requests. Please slow down.',
});

export const chatServiceLimiter = createServiceLimiter({
  prefix: 'chat-service',
  max: 15,
  message: 'Too many chat requests. Please slow down.',
});

export const pingLimiter = createLimiter({
  windowMs: WINDOW.minute,
  max: 15,
  message: 'Too many ping requests. Please try again in a minute.',
  keyGenerator: (req) => `ping:${ipKey(req)}`,
});

export const loginLimiter = createLimiter({
  windowMs: WINDOW.fifteenMinutes,
  max: 5,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return `login:${ipKey(req)}:${email || 'unknown'}`;
  },
});

export const otpLimiter = createLimiter({
  windowMs: WINDOW.fifteenMinutes,
  max: 10,
  message: 'Too many OTP attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return `otp:${ipKey(req)}:${email || 'unknown'}`;
  },
});

export const passwordResetLimiter = createLimiter({
  windowMs: WINDOW.fifteenMinutes,
  max: 3,
  message: 'Too many password reset attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return `password-reset:${ipKey(req)}:${email || 'unknown'}`;
  },
});

export const productCreateLimiter = createLimiter({
  windowMs: WINDOW.hour,
  max: 10,
  message: 'Product listing limit reached. Please try again later.',
  keyGenerator: (req) => userOrIpKey(req, 'product-create'),
});

export const uploadSignatureLimiter = createLimiter({
  windowMs: WINDOW.hour,
  max: 20,
  message: 'Upload request limit reached. Please try again later.',
  keyGenerator: (req) => userOrIpKey(req, 'upload-signature'),
});

export const offerCreateLimiter = createLimiter({
  windowMs: WINDOW.hour,
  max: 20,
  message: 'Offer limit reached. Please try again later.',
  keyGenerator: (req) => userOrIpKey(req, 'offer-create'),
});

export const paymentLimiter = createLimiter({
  windowMs: WINDOW.fifteenMinutes,
  max: 20,
  message: 'Too many payment verification attempts. Please try again later.',
  keyGenerator: (req) => userOrIpKey(req, 'payment'),
});

export const adminLimiter = createLimiter({
  windowMs: WINDOW.fifteenMinutes,
  max: 100,
  message: 'Admin action limit reached. Please try again later.',
  keyGenerator: (req) => userOrIpKey(req, 'admin'),
});

export const createWebSocketMessageLimiter = ({
  windowMs = WINDOW.second,
  max = 15,
} = {}) => {
  const buckets = new Map();

  return (userId) => {
    const now = Date.now();
    const key = String(userId);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }

    if (current.count >= max) {
      return {
        allowed: false,
        retryAfterMs: current.resetAt - now,
      };
    }

    current.count += 1;
    return { allowed: true };
  };
};
