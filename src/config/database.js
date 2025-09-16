
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 saniye timeout
      socketTimeoutMS: 45000, // 45 saniye socket timeout
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    
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
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error(' Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName
    });
    
    // Vercel için özel hata mesajları
    if (error.message.includes('IP')) {
      console.error('🌐 IP Whitelist Error:');
      console.error('   - Add Vercel IP ranges to MongoDB Atlas Network Access');
      console.error('   - Or use 0.0.0.0/0 to allow all IPs (less secure)');
    }
    
    if (error.message.includes('authentication')) {
      console.error('🔐 Authentication Error:');
      console.error('   - Check username and password in MONGODB_URI');
      console.error('   - Verify database user has proper permissions');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
