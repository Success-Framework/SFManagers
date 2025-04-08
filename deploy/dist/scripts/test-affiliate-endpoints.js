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
const axios = require('axios');
const jwt = require('jsonwebtoken');
// Create a token for test user
const token = jwt.sign({ userId: 'test-user-id', email: 'test@example.com' }, 'your-secret-key', { expiresIn: '1h' });
console.log('Test token:', token);
function testEndpoints() {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = { 'x-auth-token': token };
        try {
            // Test the affiliate-links endpoint
            console.log('\n1. Testing /api/affiliate-links/startup/test-startup-id');
            try {
                const linksResponse = yield axios.get('http://localhost:3000/api/affiliate-links/startup/test-startup-id', { headers });
                console.log('Status:', linksResponse.status);
                console.log('Data:', JSON.stringify(linksResponse.data, null, 2));
            }
            catch (error) {
                console.error('Error with affiliate-links endpoint:', error.message);
                console.error('Full error object:', JSON.stringify(error.toJSON(), null, 2));
                if (error.response) {
                    console.error('Status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                else if (error.request) {
                    console.error('No response received. Request details:', error.request);
                }
            }
            // Get the first link ID (assuming it exists)
            let firstLinkId;
            try {
                const linksResponse = yield axios.get('http://localhost:3000/api/affiliate-links/startup/test-startup-id', { headers });
                if (linksResponse.data && linksResponse.data.length > 0) {
                    firstLinkId = linksResponse.data[0].id;
                }
            }
            catch (error) {
                // Ignore errors here
            }
            // Test the affiliate-clicks endpoint if we have a link ID
            if (firstLinkId) {
                console.log('\n2. Testing /api/affiliate-clicks/' + firstLinkId);
                try {
                    const clicksResponse = yield axios.get(`http://localhost:3000/api/affiliate-clicks/${firstLinkId}`, { headers });
                    console.log('Status:', clicksResponse.status);
                    console.log('Data:', JSON.stringify(clicksResponse.data, null, 2));
                }
                catch (error) {
                    console.error('Error with affiliate-clicks endpoint:', error.message);
                    console.error('Full error object:', JSON.stringify(error.toJSON(), null, 2));
                    if (error.response) {
                        console.error('Status:', error.response.status);
                        console.error('Response data:', error.response.data);
                    }
                    else if (error.request) {
                        console.error('No response received. Request details:', error.request);
                    }
                }
            }
            else {
                console.log('\n2. Skipping clicks endpoint test because no links were found');
            }
        }
        catch (error) {
            console.error('Test failed:', error.message);
            console.error('Full error:', error);
        }
    });
}
// Start the test
testEndpoints();
