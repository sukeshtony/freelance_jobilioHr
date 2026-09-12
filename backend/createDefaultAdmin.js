require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

async function createDefaultAdmin() {
    try {
        // Use default MongoDB URI if not set
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/jobiliohr';
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists with email:', existingAdmin.email);
            console.log('You can use these credentials to log in:');
            console.log('Email:', existingAdmin.email);
            console.log('Username:', existingAdmin.username);
            process.exit();
        }

        // Create default admin credentials
        const defaultEmail = 'admin@jobiliohr.com';
        const defaultUsername = 'admin';
        const defaultPassword = 'admin123';

        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const admin = new Admin({
            username: defaultUsername,
            password: hashedPassword,
            email: defaultEmail,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Default admin user created successfully!');
        console.log('📧 Email:', defaultEmail);
        console.log('👤 Username:', defaultUsername);
        console.log('🔑 Password:', defaultPassword);
        console.log('');
        console.log('You can now log in at: http://localhost:3000/Bingus');
        process.exit();

    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}

createDefaultAdmin();
