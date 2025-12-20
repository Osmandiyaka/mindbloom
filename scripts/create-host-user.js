#!/usr/bin/env node

/**
 * Script to create a host (tenantless) user for local testing
 * Usage: node scripts/create-host-user.js --email host@local.test --password host123 --name "Host Admin"
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const argv = require('minimist')(process.argv.slice(2));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';
const email = argv.email || 'host@local.test';
const password = argv.password || 'host123';
const name = argv.name || 'Host Admin';

async function run() {
    console.log('🔧 Creating host user...');
    console.log(`Mongo: ${MONGO_URI}`);
    const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');

        const existing = await users.findOne({ email });

        // Find global Host Admin role if it exists
        const roles = db.collection('roles');
        const hostRole = await roles.findOne({ name: 'Host Admin', isGlobal: true });
        if (existing) {
            console.log('⛔ User already exists:', existing.email);
            console.log('  id:', existing._id);
            if (hostRole && (!existing.roleId || existing.roleId.toString() !== hostRole._id.toString())) {
                // Assign Host Admin role if available
                await users.updateOne({ _id: existing._id }, { $set: { roleId: hostRole._id } });
                console.log('🔁 Assigned Host Admin role to existing user');
            }

            return process.exit(0);
        }

        const hashed = await bcrypt.hash(password, 10);
        const now = new Date();

        const newUser = {
            tenantId: null,
            email,
            password: hashed,
            name,
            roleId: hostRole ? hostRole._id : null,
            permissions: [],
            profilePicture: null,
            forcePasswordReset: false,
            mfaEnabled: false,
            createdAt: now,
            updatedAt: now
        };

        const res = await users.insertOne(newUser);

        console.log('✅ Host user created successfully!');
        console.log('  Email:', email);
        console.log('  Password:', password);
        console.log('  ID:', res.insertedId.toString());
        if (hostRole) {
            console.log('  Assigned role: Host Admin (id:', hostRole._id.toString(), ')');
        } else {
            console.log('  Note: Host Admin role not found; user created without role.');
        }
        console.log('\nTip: Use the login form with no school selected (host mode) to sign in.');
    } catch (err) {
        console.error('❌ Failed to create host user:', err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
