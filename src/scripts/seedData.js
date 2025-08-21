import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Car from '../models/Car.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/avto-salon';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Car.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Create a default user for car creation
    let defaultUser = await User.findOne({ email: 'admin@example.com' });
    if (!defaultUser) {
      defaultUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567890',
        password: 'admin123',
        isVerified: true
      });
      await defaultUser.save();
    }

    // Create categories
    const categories = [
      {
        name: 'Luxury Sedans',
        description: 'Premium luxury sedans with exceptional comfort and performance',
        image: '/assets/images/cars/luxury-sedan.jpg',
        isActive: true,
        createdBy: defaultUser._id
      },
      {
        name: 'Sports Cars',
        description: 'High-performance sports cars for the ultimate driving experience',
        image: '/assets/images/cars/sports-car.jpg',
        isActive: true,
        createdBy: defaultUser._id
      },
      {
        name: 'SUVs',
        description: 'Versatile SUVs perfect for family and adventure',
        image: '/assets/images/cars/suv.jpg',
        isActive: true,
        createdBy: defaultUser._id
      },
      {
        name: 'Electric Vehicles',
        description: 'Eco-friendly electric vehicles with cutting-edge technology',
        image: '/assets/images/cars/electric.jpg',
        isActive: true,
        createdBy: defaultUser._id
      },
      {
        name: 'Classic Cars',
        description: 'Timeless classic cars with historical significance',
        image: '/assets/images/cars/classic.jpg',
        isActive: true,
        createdBy: defaultUser._id
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log('Created categories:', createdCategories.length);

    // Create cars with category associations
    const cars = [
      {
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        year: 2023,
        price: 120000,
        engine: '3.0L V6 Hybrid',
        color: 'Obsidian Black',
        distance: 15000,
        gearbox: 'Automatic',
        tinting: 'Ha',
        description: 'The epitome of luxury with cutting-edge technology and unparalleled comfort.',
        images: {
          exterior: '/assets/images/cars/mercedes-s-class-exterior.jpg',
          interior: '/assets/images/cars/mercedes-s-class-interior.jpg',
          modelType: '/assets/images/cars/mercedes-s-class.jpg'
        },
        isAvailable: true,
        category: createdCategories[0]._id, // Luxury Sedans
        createdBy: defaultUser._id
      },
      {
        brand: 'BMW',
        model: '7 Series',
        year: 2023,
        price: 110000,
        engine: '3.0L I6 Turbo',
        color: 'Alpine White',
        distance: 12000,
        gearbox: 'Automatic',
        tinting: 'Ha',
        description: 'Executive luxury sedan with innovative features and dynamic performance.',
        images: {
          exterior: '/assets/images/cars/bmw-7-exterior.jpg',
          interior: '/assets/images/cars/bmw-7-interior.jpg',
          modelType: '/assets/images/cars/bmw-7.jpg'
        },
        isAvailable: true,
        category: createdCategories[0]._id, // Luxury Sedans
        createdBy: defaultUser._id
      },
      {
        brand: 'Ferrari',
        model: 'F8 Tributo',
        year: 2023,
        price: 280000,
        engine: '3.9L V8 Twin-Turbo',
        color: 'Rosso Corsa',
        distance: 8000,
        gearbox: 'Automatic',
        tinting: 'Yo\'q',
        description: 'Pure Italian passion with breathtaking performance and stunning design.',
        images: {
          exterior: '/assets/images/cars/ferrari-f8-exterior.jpg',
          interior: '/assets/images/cars/ferrari-f8-interior.jpg',
          modelType: '/assets/images/cars/ferrari-f8.jpg'
        },
        isAvailable: true,
        category: createdCategories[1]._id, // Sports Cars
        createdBy: defaultUser._id
      },
      {
        brand: 'Lamborghini',
        model: 'Huracán',
        year: 2023,
        price: 250000,
        engine: '5.2L V10',
        color: 'Verde Mantis',
        distance: 6000,
        gearbox: 'Automatic',
        tinting: 'Yo\'q',
        description: 'Exotic supercar with aggressive styling and incredible performance.',
        images: {
          exterior: '/assets/images/cars/lamborghini-huracan-exterior.jpg',
          interior: '/assets/images/cars/lamborghini-huracan-interior.jpg',
          modelType: '/assets/images/cars/lamborghini-huracan.jpg'
        },
        isAvailable: true,
        category: createdCategories[1]._id, // Sports Cars
        createdBy: defaultUser._id
      },
      {
        brand: 'Range Rover',
        model: 'Sport',
        year: 2023,
        price: 95000,
        engine: '3.0L I6 Hybrid',
        color: 'Santorini Black',
        distance: 18000,
        gearbox: 'Automatic',
        tinting: 'Ha',
        description: 'Luxury SUV with exceptional off-road capability and refined interior.',
        images: {
          exterior: '/assets/images/cars/range-rover-sport-exterior.jpg',
          interior: '/assets/images/cars/range-rover-sport-interior.jpg',
          modelType: '/assets/images/cars/range-rover-sport.jpg'
        },
        isAvailable: true,
        category: createdCategories[2]._id, // SUVs
        createdBy: defaultUser._id
      },
      {
        brand: 'Tesla',
        model: 'Model S',
        year: 2023,
        price: 85000,
        engine: 'Dual Motor AWD',
        color: 'Pearl White',
        distance: 22000,
        gearbox: 'Single-Speed',
        tinting: 'Ha',
        description: 'Revolutionary electric sedan with incredible range and acceleration.',
        images: {
          exterior: '/assets/images/cars/tesla-model-s-exterior.jpg',
          interior: '/assets/images/cars/tesla-model-s-interior.jpg',
          modelType: '/assets/images/cars/tesla-model-s.jpg'
        },
        isAvailable: true,
        category: createdCategories[3]._id, // Electric Vehicles
        createdBy: defaultUser._id
      },
      {
        brand: 'Chevrolet',
        model: 'Corvette',
        year: 1967,
        price: 75000,
        engine: '5.7L V8',
        color: 'Rally Red',
        distance: 45000,
        gearbox: 'Manual',
        tinting: 'Yo\'q',
        description: 'Iconic American muscle car with timeless design and raw power.',
        images: {
          exterior: '/assets/images/cars/chevrolet-corvette-exterior.jpg',
          interior: '/assets/images/cars/chevrolet-corvette-interior.jpg',
          modelType: '/assets/images/cars/chevrolet-corvette.jpg'
        },
        isAvailable: true,
        category: createdCategories[4]._id, // Classic Cars
        createdBy: defaultUser._id
      },
      {
        brand: 'Lada',
        model: 'Niva',
        year: 2023,
        price: 25000,
        engine: '1.7L I4',
        color: 'Metallic Blue',
        distance: 5000,
        gearbox: 'Manual',
        tinting: 'Yo\'q',
        description: 'Reliable and rugged SUV perfect for any terrain.',
        images: {
          exterior: '/assets/images/cars/lada-niva-exterior.jpg',
          interior: '/assets/images/cars/lada-niva-interior.jpg',
          modelType: '/assets/images/cars/lada-niva.jpg'
        },
        isAvailable: true,
        category: createdCategories[2]._id, // SUVs
        createdBy: defaultUser._id
      }
    ];

    const createdCars = await Car.insertMany(cars);
    console.log('Created cars:', createdCars.length);

    console.log('Seed data completed successfully!');
    console.log('\nSample data created:');
    console.log('- Categories:', createdCategories.length);
    console.log('- Cars:', createdCars.length);
    console.log('- Default user: admin@example.com');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData(); 