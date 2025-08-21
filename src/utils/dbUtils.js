/**
 * Database utility functions
 */

/**
 * Build MongoDB query from filters
 */
export const buildQuery = (filters = {}) => {
  const query = {};
  
  // Text search
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { brand: { $regex: filters.search, $options: 'i' } },
      { model: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  // Price range
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
  }
  
  // Year range
  if (filters.minYear || filters.maxYear) {
    query.year = {};
    if (filters.minYear) query.year.$gte = Number(filters.minYear);
    if (filters.maxYear) query.year.$lte = Number(filters.maxYear);
  }
  
  // Exact matches
  ['brand', 'model', 'gearbox', 'engine', 'category'].forEach(field => {
    if (filters[field]) {
      query[field] = filters[field];
    }
  });
  
  // Boolean fields
  if (filters.isAvailable !== undefined) {
    query.isAvailable = filters.isAvailable === 'true';
  }
  
  return query;
};

/**
 * Build sort options
 */
export const buildSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  return sort;
};

/**
 * Calculate pagination skip value
 */
export const calculateSkip = (page, limit) => {
  return (page - 1) * limit;
};
