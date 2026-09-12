require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin'); // adjust path if needed

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const existingAdmin = await Admin.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists.');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        const admin = new Admin({
            username: process.env.ADMIN_USERNAME,
            password: hashedPassword,
            email: process.env.ADMIN_EMAIL,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully.');
        process.exit();

    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();