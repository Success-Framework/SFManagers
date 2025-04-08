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
const prisma = new PrismaClient();
function createTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Test data configuration
            const userId = '840489f9-95ad-488a-a6f7-4c5505942cf5'; // Use your actual user ID
            const startupId = 'd31c0d7f-c95b-4acd-b005-90db1829f70c'; // Use the startup ID from your URL
            // First, check for existing data
            console.log('Checking for existing links...');
            const existingLinks = yield prisma.affiliateLink.findMany({
                where: { startupId }
            });
            console.log(`Found ${existingLinks.length} existing links for startup ${startupId}`);
            for (const link of existingLinks) {
                const clickCount = yield prisma.affiliateClick.count({
                    where: { linkId: link.id }
                });
                console.log(`- Link "${link.name}": ${clickCount} clicks (stored count: ${link.clicks})`);
            }
            // Generate test link if none exists
            let testLink;
            if (existingLinks.length === 0) {
                console.log('Creating test affiliate link...');
                testLink = yield prisma.affiliateLink.create({
                    data: {
                        name: 'Test Analytics Link',
                        code: `test-${Date.now()}`,
                        userId,
                        startupId,
                        clicks: 0,
                        conversions: 0
                    }
                });
                console.log('Created test link:', testLink);
            }
            else {
                testLink = existingLinks[0];
                console.log('Using existing link:', testLink);
            }
            // Create test clicks
            console.log('Creating test clicks...');
            for (let i = 0; i < 5; i++) {
                const click = yield prisma.affiliateClick.create({
                    data: {
                        linkId: testLink.id,
                        ipAddress: `192.168.1.${i + 1}`,
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        country: ['United States', 'India', 'Canada', 'Germany', 'Australia'][i],
                        city: ['New York', 'Mumbai', 'Toronto', 'Berlin', 'Sydney'][i],
                        referrer: 'https://example.com'
                    }
                });
                console.log(`Created click ${i + 1}:`, click.id);
            }
            // Update click count on the link
            yield prisma.affiliateLink.update({
                where: { id: testLink.id },
                data: { clicks: { increment: 5 } }
            });
            console.log('Test data created successfully!');
            console.log('Now you can check the Affiliate Analytics dashboard');
        }
        catch (error) {
            console.error('Error creating test data:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
createTestData();
