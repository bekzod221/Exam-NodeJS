import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { requireAdminAuth } from "../middleware/admin.middleware.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import Bookmark from "../models/Bookmark.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";

const viewRouter = Router();

// Apply optional auth to all routes
viewRouter.use(optionalAuth);

viewRouter.get("/", async (req, res) => {
  res.render("pages/index", {
    title: "Avto Salon - Bosh sahifa",
    user: req.user,
    breadcrumbs: []
  });
});

viewRouter.get("/models", async (req, res) => {
  res.render("pages/index", {
    title: "Avto Salon - Modellari",
    user: req.user,
    breadcrumbs: ["Modellari"]
  });
});

viewRouter.get("/models/:brand", async (req, res) => {
  try {
    const { brand } = req.params;
    const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
    
    // Get cars from MongoDB with category populated
    const cars = await Car.find({ 
      brand: { $regex: new RegExp(brandName, 'i') },
      isAvailable: true 
    }).populate('category', 'name').sort({ createdAt: -1 });
    
    // Transform to models format
    const models = cars.map(car => ({
      id: car._id,
      name: `${car.brand} ${car.model}`,
      price: car.price,
      image: car.images.modelType || "/assets/images/chevrolet.jpg",
      category: car.category
    }));
    
    res.render("pages/models", {
      title: `${brandName} - Modellar turlari`,
      user: req.user,
      brand: brandName,
      models,
      breadcrumbs: ["Modellari", `${brandName} turlari`]
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

viewRouter.get("/models/:brand/:id", async (req, res) => {
  try {
    const { brand, id } = req.params;
    const { view = 'exterior' } = req.query;
    const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
    
    // Get car from MongoDB with category populated
    const car = await Car.findById(id).populate('category', 'name');
    
    if (!car) {
      return res.status(404).render("pages/404", { title: "Mashina topilmadi" });
    }
    
    res.render("pages/car-detail", {
      title: `${car.brand} ${car.model} - Batafsil`,
      user: req.user,
      car,
      currentView: view,
      breadcrumbs: ["Modellari", `${brandName} turlari`, car.model]
    });
  } catch (error) {
    console.error('Error fetching car details:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

viewRouter.get("/admin-login", (req, res) => {
  if (req.admin) {
    return res.redirect("/admin");
  }
  res.render("pages/admin-login", {
    title: "Admin Kirish",
    user: req.user,
    breadcrumbs: ["Admin kirish"]
  });
});

viewRouter.get("/admin", requireAdminAuth, async (req, res) => {
  try {
    // Get cars from MongoDB
    const cars = await Car.find().sort({ createdAt: -1 });
    
    res.render("pages/admin", {
      title: "Admin Panel",
      admin: req.admin,
      cars,
      breadcrumbs: ["Admin panel"]
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

viewRouter.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("pages/login", { 
    title: "Kirish",
    user: req.user,
    breadcrumbs: ["Kirish"]
  });
});

viewRouter.get("/register", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("pages/register", { 
    title: "Ro'yxatdan o'tish",
    user: req.user,
    breadcrumbs: ["Ro'yxatdan o'tish"]
  });
});

viewRouter.get("/profile", requireAuth, (req, res) => {
  res.render("pages/profile", {
    title: "Profilingiz",
    user: req.user,
    breadcrumbs: ["Profil"]
  });
});

viewRouter.get("/bookmarks", requireAuth, async (req, res) => {
  try {
    // Get user's bookmarks from MongoDB
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate('carId')
      .sort({ createdAt: -1 });
    
    const bookmarkedCars = bookmarks.map(bookmark => bookmark.carId).filter(Boolean);
    
    res.render("pages/bookmarks", {
      title: "Tanlanganlar",
      user: req.user,
      bookmarks: bookmarkedCars,
      breadcrumbs: ["Sevimlilar"]
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

viewRouter.get("/cart", requireAuth, (req, res) => {
  res.render("pages/cart", {
    title: "Shopping Cart",
    user: req.user,
    breadcrumbs: ["Cart"]
  });
});

viewRouter.get("/categories", async (req, res) => {
  try {
    // Get categories from MongoDB
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    // Get car count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const carCount = await Car.countDocuments({ 
          category: category._id, 
          isAvailable: true 
        });
        return {
          ...category.toObject(),
          carCount
        };
      })
    );
    
    res.render("pages/categories", {
      title: "Vehicle Categories",
      user: req.user,
      categories: categoriesWithCount,
      breadcrumbs: ["Categories"]
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

viewRouter.get("/categories/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Get category and its cars
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).render("pages/404", { title: "Category not found" });
    }
    
    const cars = await Car.find({ 
      category: categoryId,
      isAvailable: true 
    }).populate('category', 'name').sort({ createdAt: -1 });
    
    res.render("pages/category-detail", {
      title: `${category.name} - Vehicles`,
      user: req.user,
      category,
      cars,
      breadcrumbs: ["Categories", category.name]
    });
  } catch (error) {
    console.error('Error fetching category details:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

viewRouter.get("/payment", requireAuth, async (req, res) => {
  try {
    // Get user's orders from MongoDB
    const orders = await Order.find({ userId: req.user._id })
      .populate('carId')
      .sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      return res.redirect("/");
    }
    
    // Calculate total amount
    const totalAmount = orders.reduce((total, order) => {
      return total + (order.carId.price * order.quantity);
    }, 0);
    
    res.render("pages/payment", {
      title: "To'lov",
      user: req.user,
      orderItems: orders,
      totalAmount: totalAmount,
      breadcrumbs: ["To'lov"]
    });
  } catch (error) {
    console.error('Error fetching payment data:', error);
    res.status(500).render("pages/404", { title: "Error" });
  }
});

export { viewRouter };
