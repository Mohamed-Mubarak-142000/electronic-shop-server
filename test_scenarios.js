import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
    try {
        console.log('--- Starting Test Scenarios ---');

        // 1. Login
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('   Login Successful. Token obtained.');

        // 2. Get All Products
        console.log('2. Fetching All Products...');
        const productsRes = await axios.get(`${API_URL}/products`);
        console.log(`   Fetched ${productsRes.data.products.length} products (Total: ${productsRes.data.total}).`);
        if (productsRes.data.products.length !== 6) throw new Error('Expected 6 products');

        // 3. Filter by Category (need to fetch categories first to get ID, or filter by what?)
        // The API uses ID for category filtering.
        console.log('3. Fetching Categories...');
        const catRes = await axios.get(`${API_URL}/categories`);
        const laptopCat = catRes.data.find(c => c.name === 'Laptops');
        const cameraCat = catRes.data.find(c => c.name === 'Cameras');

        console.log(`   Filtering by Category: Laptops (${laptopCat._id})...`);
        const laptopsRes = await axios.get(`${API_URL}/products?category=${laptopCat._id}`);
        console.log(`   Found ${laptopsRes.data.products.length} laptops.`);
        if (laptopsRes.data.products.length !== 2) throw new Error('Expected 2 laptops');

        // 4. Filter by Brand
        console.log('4. Fetching Brands...');
        const brandRes = await axios.get(`${API_URL}/brands`);
        const appleBrand = brandRes.data.find(b => b.name === 'Apple');
        const dellBrand = brandRes.data.find(b => b.name === 'Dell');

        console.log(`   Filtering by Brand: Apple (${appleBrand._id})...`);
        const appleRes = await axios.get(`${API_URL}/products?brand=${appleBrand._id}`);
        console.log(`   Found ${appleRes.data.products.length} Apple products.`);
        if (appleRes.data.products.length !== 2) throw new Error('Expected 2 Apple products');

        // 5. Delete a Product
        const productToDelete = productsRes.data.products[0];
        console.log(`5. Deleting Product: ${productToDelete.name} (${productToDelete._id})...`);
        await axios.delete(`${API_URL}/products/${productToDelete._id}`, config);
        console.log('   Product Deleted.');

        // Verify Deletion
        const productsAfterDelete = await axios.get(`${API_URL}/products`);
        console.log(`   Products remaining: ${productsAfterDelete.data.total}`);
        if (productsAfterDelete.data.total !== 5) throw new Error('Expected 5 products after deletion');

        // 6. Delete a Brand
        console.log(`6. Deleting Brand: Dell (${dellBrand._id})...`);
        await axios.delete(`${API_URL}/brands/${dellBrand._id}`, config);
        console.log('   Brand Deleted.');

        // 7. Delete a Category
        console.log(`7. Deleting Category: Cameras (${cameraCat._id})...`);
        await axios.delete(`${API_URL}/categories/${cameraCat._id}`, config);
        console.log('   Category Deleted.');

        console.log('--- All Tests Passed Successfully! ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
        }
        process.exit(1);
    }
};

runTests();
