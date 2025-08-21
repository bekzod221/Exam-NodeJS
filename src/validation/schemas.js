import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Ism 50 ta belgidan oshmasligi kerak',
    'any.required': 'Ism kiritilishi shart'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email manzil noto\'g\'ri formatda',
    'any.required': 'Email kiritilishi shart'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    'any.required': 'Parol kiritilishi shart'
  }),
  phone: Joi.string().pattern(/^(\+998|998|8)?[0-9]{9}$/).messages({
    'string.pattern.base': 'Telefon raqam noto\'g\'ri formatda'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email manzil noto\'g\'ri formatda',
    'any.required': 'Email kiritilishi shart'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Parol kiritilishi shart'
  })
});

export const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Kod 6 ta raqamdan iborat bo\'lishi kerak',
    'string.pattern.base': 'Kod faqat raqamlardan iborat bo\'lishi kerak'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email manzil noto\'g\'ri formatda',
    'any.required': 'Email kiritilishi shart'
  })
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    'any.required': 'Yangi parol kiritilishi shart'
  })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Joriy parol kiritilishi shart'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    'any.required': 'Yangi parol kiritilishi shart'
  })
});

// Category validation schemas
export const categorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Kategoriya nomi 50 ta belgidan oshmasligi kerak',
    'any.required': 'Kategoriya nomi kiritilishi shart'
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'Tavsif 500 ta belgidan oshmasligi kerak'
  }),
  isActive: Joi.boolean()
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    'string.min': 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Kategoriya nomi 50 ta belgidan oshmasligi kerak'
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'Tavsif 500 ta belgidan oshmasligi kerak'
  }),
  isActive: Joi.boolean()
});

// Car validation schemas
export const carSchema = Joi.object({
  brand: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Marka nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Marka nomi 50 ta belgidan oshmasligi kerak',
    'any.required': 'Marka nomi kiritilishi shart'
  }),
  model: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Model nomi kamida 1 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Model nomi 50 ta belgidan oshmasligi kerak',
    'any.required': 'Model nomi kiritilishi shart'
  }),
  year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required().messages({
    'number.min': 'Yil 1990 dan kam bo\'lmasligi kerak',
    'number.max': `Yil ${new Date().getFullYear() + 1} dan oshmasligi kerak`,
    'any.required': 'Yil kiritilishi shart'
  }),
  price: Joi.number().positive().required().messages({
    'number.positive': 'Narx musbat son bo\'lishi kerak',
    'any.required': 'Narx kiritilishi shart'
  }),
  engine: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Motor ma\'lumoti kamida 2 ta belgidan iborat bo\'lishi kerak',
    'any.required': 'Motor ma\'lumoti kiritilishi shart'
  }),
  color: Joi.string().min(2).max(30).required().messages({
    'string.min': 'Rang nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
    'any.required': 'Rang kiritilishi shart'
  }),
  distance: Joi.number().min(0).required().messages({
    'number.min': 'Masofa manfiy bo\'lmasligi kerak',
    'any.required': 'Masofa kiritilishi shart'
  }),
  gearbox: Joi.string().valid('Manual', 'Automatic', 'CVT').required().messages({
    'any.only': 'Gearbox turi Manual, Automatic yoki CVT bo\'lishi kerak',
    'any.required': 'Gearbox turi kiritilishi shart'
  }),
  tinting: Joi.string().valid('Ha', 'Yo\'q').default('Yo\'q'),
  description: Joi.string().max(1000).messages({
    'string.max': 'Tavsif 1000 ta belgidan oshmasligi kerak'
  }),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Kategoriya ID noto\'g\'ri formatda',
    'any.required': 'Kategoriya kiritilishi shart'
  }),
  isAvailable: Joi.boolean().default(true)
});

export const updateCarSchema = Joi.object({
  brand: Joi.string().min(2).max(50),
  model: Joi.string().min(1).max(50),
  year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1),
  price: Joi.number().positive(),
  engine: Joi.string().min(2).max(50),
  color: Joi.string().min(2).max(30),
  distance: Joi.number().min(0),
  gearbox: Joi.string().valid('Manual', 'Automatic', 'CVT'),
  tinting: Joi.string().valid('Ha', 'Yo\'q'),
  description: Joi.string().max(1000),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  isAvailable: Joi.boolean()
});

// Query validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const carSearchSchema = Joi.object({
  brand: Joi.string(),
  model: Joi.string(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minYear: Joi.number().integer().min(1990),
  maxYear: Joi.number().integer().max(new Date().getFullYear() + 1),
  color: Joi.string(),
  engine: Joi.string(),
  gearbox: Joi.string().valid('Manual', 'Automatic', 'CVT'),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  isAvailable: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Profile update schema
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  phone: Joi.string().pattern(/^(\+998|998|8)?[0-9]{9}$/).messages({
    'string.pattern.base': 'Telefon raqam noto\'g\'ri formatda'
  })
});
