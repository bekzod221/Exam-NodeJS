import User from '../models/User.js';
import Car from '../models/Car.js';
import Order from '../models/Order.js';

export const getAnalytics = async (req, res) => {
  try {
    const [
      userStats,
      carStats,
      orderStats,
      recentActivity,
      monthlyData
    ] = await Promise.all([
      getUserAnalytics(),
      getCarAnalytics(),
      getOrderAnalytics(),
      getRecentActivity(),
      getMonthlyAnalytics()
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        cars: carStats,
        orders: orderStats,
        recentActivity,
        monthlyData
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Analitika ma\'lumotlarini olishda xatolik'
    });
  }
};

const getUserAnalytics = async () => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const verifiedUsers = await User.countDocuments({ role: 'user', isVerified: true });
  const newUsersThisMonth = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  const userGrowth = await User.aggregate([
    {
      $match: {
        role: 'user',
        createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    total: totalUsers,
    verified: verifiedUsers,
    newThisMonth: newUsersThisMonth,
    verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    growth: userGrowth
  };
};

const getCarAnalytics = async () => {
  const totalCars = await Car.countDocuments();
  const availableCars = await Car.countDocuments({ isAvailable: true });

  const carsByBrand = await Car.aggregate([
    {
      $group: {
        _id: '$brand',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const priceRanges = await Car.aggregate([
    {
      $bucket: {
        groupBy: '$price',
        boundaries: [0, 50000000, 100000000, 200000000, 500000000, 1000000000],
        default: '1000000000+',
        output: {
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      }
    }
  ]);

  return {
    total: totalCars,
    available: availableCars,
    unavailable: totalCars - availableCars,
    availabilityRate: totalCars > 0 ? Math.round((availableCars / totalCars) * 100) : 0,
    byBrand: carsByBrand,
    priceRanges
  };
};

const getOrderAnalytics = async () => {
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }
    }
  ]);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    total: totalOrders,
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
    byStatus: ordersByStatus,
    monthlyRevenue,
    avgOrderValue: totalOrders > 0 ? (totalRevenue.length > 0 ? totalRevenue[0].total / totalOrders : 0) : 0
  };
};

const getRecentActivity = async () => {
  const recentUsers = await User.find({ role: 'user' })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentOrders = await Order.find()
    .populate('userId', 'name email')
    .populate('carId', 'brand model')
    .select('userId carId totalPrice status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    recentUsers,
    recentOrders
  };
};

const getMonthlyAnalytics = async () => {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  const [thisMonth, lastMonth] = await Promise.all([
    getMonthData(startOfMonth),
    getMonthData(startOfLastMonth, startOfMonth)
  ]);

  return {
    current: thisMonth,
    previous: lastMonth,
    growth: {
      users: lastMonth.users > 0 ? Math.round(((thisMonth.users - lastMonth.users) / lastMonth.users) * 100) : 0,
      orders: lastMonth.orders > 0 ? Math.round(((thisMonth.orders - lastMonth.orders) / lastMonth.orders) * 100) : 0,
      revenue: lastMonth.revenue > 0 ? Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100) : 0
    }
  };
};

const getMonthData = async (startDate, endDate = new Date()) => {
  const [users, orders, revenue] = await Promise.all([
    User.countDocuments({
      role: 'user',
      createdAt: { $gte: startDate, $lt: endDate }
    }),
    Order.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ])
  ]);

  return {
    users,
    orders,
    revenue: revenue.length > 0 ? revenue[0].total : 0
  };
};
