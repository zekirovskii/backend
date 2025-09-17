
const mongoose = require('mongoose');

// Global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // Eğer zaten bağlıysa, mevcut bağlantıyı döndür
    if (cached.conn) {
      console.log('📦 Using cached MongoDB connection');
      return cached.conn;
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Eğer bağlantı promise'i varsa, onu bekle
    if (!cached.promise) {
      const opts = {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        family: 4, // IPv4 zorla
        useNewUrlParser: true,
        useUnifiedTopology: true,
        directConnection: true // Non-SRV için
      };

      cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
        console.log(`📦 MongoDB Connected: ${mongoose.connection.host}`);
        console.log(`🗄️ Database: ${mongoose.connection.name}`);
        console.log(`🔗 Connection State: ${mongoose.connection.readyState}`);
        return mongoose;
      });
    }

    cached.conn = await cached.promise;
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    return cached.conn;
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error(' Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName
    });
    
    // Vercel için özel hata mesajları
    if (error.name === 'MongooseServerSelectionError') {
      console.error('🌐 Server Selection Error:');
      console.error('   - IPv6 connection issue detected');
      console.error('   - Forced IPv4 should resolve this');
    }
    
    if (error.name === 'MongooseAuthenticationError') {
      console.error('🔐 Authentication Error:');
      console.error('   - Check username and password in MONGODB_URI');
      console.error('   - Verify database user has proper permissions');
    }
    
    throw error;
  }
};

module.exports = connectDB;
