"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
function createTestUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const hashedPassword = yield bcrypt.hash('password123', 10);
            const user = yield prisma.user.upsert({
                where: { email: 'test@example.com' },
                update: {
                    name: 'Test User',
                    password: hashedPassword
                },
                create: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    name: 'Test User',
                    password: hashedPassword
                }
            });
            console.log('Test user created/updated:', user);
            // Create a test startup
            const startup = yield prisma.startup.upsert({
                where: { id: 'test-startup-id' },
                update: {
                    name: 'Test Startup',
                    details: 'Test startup details',
                    ownerId: user.id
                },
                create: {
                    id: 'test-startup-id',
                    name: 'Test Startup',
                    details: 'Test startup details',
                    ownerId: user.id
                }
            });
            console.log('Test startup created/updated:', startup);
            // Create a test affiliate link
            const link = yield prisma.affiliateLink.upsert({
                where: { code: 'testlink123' },
                update: {
                    name: 'Test Link',
                    userId: user.id,
                    startupId: startup.id,
                    clicks: 0,
                    conversions: 0
                },
                create: {
                    name: 'Test Link',
                    code: 'testlink123',
                    userId: user.id,
                    startupId: startup.id,
                    clicks: 0,
                    conversions: 0
                }
            });
            console.log('Test affiliate link created/updated:', link);
        }
        catch (error) {
            console.error('Error creating test data:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
createTestUser();
