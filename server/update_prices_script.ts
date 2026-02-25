import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePrices() {
    const username = 'admin_test_511';

    // 1. Find the restaurant
    const restaurant = await prisma.restaurant.findUnique({
        where: { username }
    });

    if (!restaurant) {
        console.error(`Restaurant with username ${username} not found.`);
        return;
    }

    console.log(`Updating prices for restaurant: ${restaurant.name} (${restaurant.id})`);

    // 2. Define the price updates based on the images
    // Note: Half and Full prices are mapped where applicable. If only one price exists, it maps to fullPrice.
    const priceUpdates = [
        // BREAKFAST
        { name: 'Poori Sabji - 4 Pc', fullPrice: 60 },
        { name: 'Chhole + Plain Bhature', fullPrice: 70 },
        { name: 'Chhole + Paneer Bhature', fullPrice: 90 },
        { name: 'Aloo Paratha with Curd - 2 Pcs', fullPrice: 99 },
        { name: 'Gobhi Paratha with Curd - 2 Pcs', fullPrice: 109 },
        { name: 'Mooli Paratha with Curd - 2 Pcs', fullPrice: 109 },
        { name: 'Mix Veg Paratha with Curd - 2 Pcs', fullPrice: 109 },
        { name: 'Paneer Paratha with Curd - 2 Pcs', fullPrice: 129 },
        { name: 'Veg Sandwich', fullPrice: 69 },
        { name: 'Classic Grill Sandwich', fullPrice: 139 },
        { name: 'Shri Radhe Radhe Paneer Grill Sandwich', fullPrice: 169 },
        { name: 'Cheese Grill Sandwich', fullPrice: 149 },
        { name: 'Indori Poha', fullPrice: 129 },

        // HOT BEVERAGE
        { name: 'Lemon Tea', fullPrice: 29 },
        { name: 'Black Tea', fullPrice: 39 },
        { name: 'Ice Tea', fullPrice: 59 },
        { name: 'Milk Tea', fullPrice: 49 },
        { name: 'Masala Tea', fullPrice: 59 },
        { name: 'Ginger Tea', fullPrice: 49 },
        { name: 'Elaichi Tea', fullPrice: 59 },
        { name: 'Hot Coffee', fullPrice: 59 },
        { name: 'Espresso Coffee', fullPrice: 59 },
        { name: 'Chocolate Cappuccino', fullPrice: 79 },
        { name: 'Hot Choclate Milk', fullPrice: 79 },

        // MOCKTAIL
        { name: 'Spicy Mango', fullPrice: 99 },
        { name: 'Vergin Mojito', fullPrice: 99 },
        { name: 'Red Litchi Dragon', fullPrice: 109 },
        { name: 'Red Rose', fullPrice: 109 },
        { name: 'Orange', fullPrice: 89 },
        { name: 'Blue Legoon', fullPrice: 99 },
        { name: 'Watermelon', fullPrice: 79 },
        { name: 'Kiwi', fullPrice: 109 },
        { name: 'Jamun Shot', fullPrice: 139 },
        { name: 'Black Current', fullPrice: 139 },
        { name: 'Green Apple', fullPrice: 130 },
        { name: 'Aam Panna', fullPrice: 110 },
        { name: 'Tango Mango', fullPrice: 140 },
        { name: 'Banta Soda', fullPrice: 90 },

        // LASSI
        { name: 'Mango Lassi', fullPrice: 169 },
        { name: 'Strawberry Lassi', fullPrice: 179 },
        { name: 'Chocolate Lassi', fullPrice: 189 },
        { name: 'Sweet Lassi', fullPrice: 89 },
        { name: 'Salted Lassi', fullPrice: 89 },
        { name: 'Butter Milk', fullPrice: 49 },
        { name: 'Masala Butter Milk', fullPrice: 59 },

        // THANDA THANDA COOL COOL
        { name: 'Cold Coffee', fullPrice: 79 },
        { name: 'Cold Coffee With Icecream', fullPrice: 109 },
        { name: 'Vanilla Milk Shake', fullPrice: 99 },
        { name: 'Strawberry Milk Shake', fullPrice: 109 },
        { name: 'Butter Scotch Shake', fullPrice: 109 },
        { name: 'Oreo Shake', fullPrice: 109 },
        { name: 'Kitkat Shake', fullPrice: 109 },
        { name: 'Chocolate Shake', fullPrice: 99 },
        { name: 'Mango Shake', fullPrice: 109 },
        // Excluding As per mrp items for price update
        { name: 'Masala Colddrink', fullPrice: 80 },
        { name: 'Mix Fruit Punch', fullPrice: 149 },

        // SOUP
        { name: 'Veg Sweet Corn Soup', fullPrice: 109 },
        { name: 'Veg Munchow Soup', fullPrice: 109 },
        { name: 'Veg Hot & Sour Soup', fullPrice: 109 },
        { name: 'Veg Lemon Corriander Soup', fullPrice: 129 },
        { name: 'Cream of Tomato Soup', fullPrice: 109 },
        { name: 'Cream of Mushroom Soup', fullPrice: 119 },
        { name: 'Veg Pikking Soup', fullPrice: 99 },
        { name: 'Veg Talu Men Soup', fullPrice: 109 },
        { name: 'Shree Radhe Radhe Soup', fullPrice: 120 },

        // MAHARANI KI DAL
        { name: 'Plain Yellow Dal', halfPrice: 100, fullPrice: 179 },
        { name: 'Jeera Dal', halfPrice: 120, fullPrice: 185 },
        { name: 'Chatpati Dal', halfPrice: 120, fullPrice: 199 },
        { name: 'Dal Tadka', halfPrice: 120, fullPrice: 195 },
        { name: 'Punjabi Dal Tadka', halfPrice: 120, fullPrice: 219 },
        { name: 'Dal Maharani', halfPrice: 150, fullPrice: 239 },
        { name: 'Dal Makhani Radhe Radhe Special', halfPrice: 150, fullPrice: 269 },

        // KHUSHBU E BASMATI
        { name: 'Steam Rice', halfPrice: 69, fullPrice: 99 },
        { name: 'Jeera Rice', halfPrice: 79, fullPrice: 119 },
        { name: 'Butter Rice', halfPrice: 109, fullPrice: 149 },
        { name: 'Ghee Rice', halfPrice: 109, fullPrice: 149 },
        { name: 'Green Peas Pulao', halfPrice: 89, fullPrice: 129 },
        { name: 'Dal Khichari', halfPrice: 139, fullPrice: 199 },
        { name: 'Veg Pulao', fullPrice: 199 },
        { name: 'Kashmiri Pulao', fullPrice: 299 },
        { name: 'Navratan Pulao', fullPrice: 329 },
        { name: 'Veg Hyderabadi Dum Rice With Raita', fullPrice: 319 },
        { name: 'Paneer Hyderabadi Dum Rice With Raita', fullPrice: 359 },
        { name: 'Veg Luckhnavi Dum Rice With Raita', fullPrice: 319 },
        { name: 'Paneer Luckhnavi Dum Rice With Raita', fullPrice: 349 },

        // Bread & Roti
        { name: 'Tandoori Plain Roti', fullPrice: 15 },
        { name: 'Tandoori Butter Roti', fullPrice: 20 },
        { name: 'Plain Tawa Roti', fullPrice: 12 },
        { name: 'Butter Tawa Roti', fullPrice: 15 },
        { name: 'Missi Roti', fullPrice: 39 },
        { name: 'Lachha Paratha', fullPrice: 45 },
        { name: 'Pudina Paratha', fullPrice: 50 },
        { name: 'Cheese Chilli Paratha', fullPrice: 89 },
        { name: 'Masala Paratha', fullPrice: 75 },
        { name: 'Plain Kulcha', fullPrice: 45 },
        { name: 'Onion Kulcha', fullPrice: 70 },
        { name: 'Masala Kulcha', fullPrice: 80 },
        { name: 'Amritsari Kulcha', fullPrice: 85 },
        { name: 'Aloo Kulcha', fullPrice: 75 },
        { name: 'Paneer Kulcha', fullPrice: 109 },
        { name: 'Plain Naan', fullPrice: 40 },
        { name: 'Butter Naan', fullPrice: 50 },
        { name: 'Garlic Naan', fullPrice: 80 },
        { name: 'Kashmiri Naan', fullPrice: 150 },
        { name: 'Cheese Naan', fullPrice: 99 },
        { name: 'Cheese Chilli Garlic Naan', fullPrice: 130 },
        { name: 'Stuffed Naan', fullPrice: 99 },
        { name: 'Cheese Chilli Garlic Roti', fullPrice: 59 },
        { name: 'Shree Radhe Radhe Spl. Kulcha', fullPrice: 110 },

        // INDIAN COMBO
        { name: 'Mix veg , Jeera Rice & Dal Combo', fullPrice: 159 },
        { name: 'Dal Makhni , Veg Pulao & Roti - 2 Pcs', fullPrice: 189 },
        { name: 'Shahi Paneer with 1 Butter Nan & 1 Roti', fullPrice: 189 },

        // THALI
        { name: 'Bahubali Thali', fullPrice: 350 },
        { name: 'Shree Radhe Radhe Spl. Thali', fullPrice: 380 },

        // SOUTH INDIAN
        { name: 'Plain Dosa', fullPrice: 89 },
        { name: 'Masala Dosa', fullPrice: 109 },
        { name: 'Butter Plain Dosa', fullPrice: 129 },
        { name: 'Butter Masala Dosa', fullPrice: 149 },
        { name: 'Paneer Plain Dosa', fullPrice: 159 },
        { name: 'Paneer Masala Dosa', fullPrice: 169 },
        { name: 'Paneer Butter Masala Dosa', fullPrice: 179 },
        { name: 'Cheese Plain Dosa', fullPrice: 159 },
        { name: 'Cheese Masala Dosa', fullPrice: 179 },
        { name: 'Rava Dosa', fullPrice: 139 },
        { name: 'Rava Masala Dosa', fullPrice: 159 },
        { name: 'Rava Cheese Dosa', fullPrice: 179 },
        { name: 'Rava Butter Paneer Dosa', fullPrice: 190 },
        { name: 'Schezwan masala Dosa', fullPrice: 159 },
        { name: 'Radhe Radhe Special dosa', fullPrice: 195 },
        { name: 'Sambhar Vada -2 Pcs', fullPrice: 69 },
        { name: 'Idli Sambhar -2 Pcs', fullPrice: 69 },
        { name: 'Fry Idli - 2 Pcs', fullPrice: 59 },
        { name: 'Masala Uttapam', fullPrice: 109 },
        { name: 'Onion Uttapam', fullPrice: 129 },
        { name: 'Mix Uttapam', fullPrice: 149 },
        { name: 'South Indian Thali', fullPrice: 210 },

        // TANDOORI STARTER
        { name: 'Paneer Tikka', halfPrice: 199, fullPrice: 299 },
        { name: 'Achari Paneer Tikka', halfPrice: 205, fullPrice: 310 },
        { name: 'Lajawab Paneer Tikka', halfPrice: 209, fullPrice: 320 },
        { name: 'Lahsuni Paneer Tikka', halfPrice: 205, fullPrice: 310 },
        { name: 'Lahori Paneer Tikka', halfPrice: 205, fullPrice: 309 },
        { name: 'Malai Paneer Tikka', halfPrice: 229, fullPrice: 350 },
        { name: 'Mexican Pineapple Tikka', halfPrice: 199, fullPrice: 299 },
        { name: 'Malai Soya Chaap', halfPrice: 185, fullPrice: 265 },
        { name: 'Tandoori Soya Chaap', halfPrice: 155, fullPrice: 215 },
        { name: 'Achari Soya Chaap', halfPrice: 175, fullPrice: 249 },
        { name: 'Special Radhe Radhe Soya Chaap', halfPrice: 199, fullPrice: 299 },
        { name: 'Tandoori Mushroom Tikka 5Pcs / 10 Pcs', halfPrice: 199, fullPrice: 300 },
        { name: 'Kumbh Motichoor Stuff 5Pcs / 10 Pcs', halfPrice: 189, fullPrice: 289 },
        { name: 'Kumbh Achari Tikka 5Pcs / 10 Pcs', halfPrice: 180, fullPrice: 259 },
        { name: 'Lucknowi Seekh / 8 Pcs', fullPrice: 230 },
        { name: 'Hara Bhara Tikki', halfPrice: 195, fullPrice: 280 },
        { name: 'Dahi Paneer Tikki', halfPrice: 185, fullPrice: 260 },
        { name: 'Corn Tikki', halfPrice: 189, fullPrice: 270 },

        // SALAD, PAPAD & RAITA
        { name: 'Green Salad', fullPrice: 89 },
        { name: 'Cucumber Salad', fullPrice: 85 },
        { name: 'Onion Salad', fullPrice: 80 },
        { name: 'Kimchi Salad', fullPrice: 80 },
        { name: 'Kachumber Salad', fullPrice: 79 },
        { name: 'Fruit Salad', fullPrice: 150 },
        { name: 'Russian Salad', fullPrice: 169 },
        { name: 'Roasted Papad', fullPrice: 15 },
        { name: 'Fried Papad', fullPrice: 25 },
        { name: 'Masala Papad', fullPrice: 50 },
        { name: 'Plain Curd', fullPrice: 50 },
        { name: 'Mix Rayta', fullPrice: 109 },
        { name: 'Boondi Raita', fullPrice: 99 },
        { name: 'Cucumber Raita', fullPrice: 89 },
        { name: 'Pineapple Raita', fullPrice: 119 },
        { name: 'Fruit Raita', fullPrice: 129 },

        // INDIAN MAIN COURSE
        { name: 'Kadhai Paneer - Half / Full', halfPrice: 209, fullPrice: 345 },
        { name: 'Handi Paneer - Half / Full', halfPrice: 209, fullPrice: 345 },
        { name: 'Shahi Paneer (White Spl./ Normal) Half / Full', halfPrice: 209, fullPrice: 359 },
        { name: 'Spl Paneer Tikka Masala 6 Pcs', fullPrice: 329 },
        { name: 'Paneer 2 Pyaza Half / Full', halfPrice: 209, fullPrice: 329 },
        { name: 'Paneer Lababdar  5 Half / 10 Full', halfPrice: 240, fullPrice: 409 },
        { name: 'Aloo Gobhi Matar Seasonal', halfPrice: 155, fullPrice: 250 },
        { name: 'Paneer Patiala / 8 Pcs.', fullPrice: 519 },
        { name: 'Paneer Toofani / 8 Pcs', fullPrice: 449 },
        { name: 'Paneer Punjabi Tadka / 8 Pcs', fullPrice: 449 },
        { name: 'Paneer Jaipuri / 8 Pcs/', fullPrice: 349 },
        { name: 'Paneer Kolhapuri / 8 Pcs', fullPrice: 509 },
        { name: 'Paneer Butter Masala  4 Pcs / 8 Pcs', halfPrice: 209, fullPrice: 309 },
        { name: 'Matar Paneer Masala 4Pcs / 8 Pcs', halfPrice: 219, fullPrice: 319 },
        { name: 'Palak Paneer / 8 Pcs', fullPrice: 349 },
        { name: 'Chatpata Paneer Masala / 8 Pcs', fullPrice: 379 },
        { name: 'Paneer Hari Tingari Payaja Spl', fullPrice: 339 },
        { name: 'Paneer Dhaniya Adaraki', fullPrice: 399 },
        { name: 'Khoya Paneer', fullPrice: 409 },
        { name: 'Matar Methi Malai', halfPrice: 289, fullPrice: 409 },
        { name: 'Paneer Methi Malai', halfPrice: 289, fullPrice: 419 },
        { name: 'Paneer Kaju  Masala', fullPrice: 399 },
        { name: 'Paneer Baby Corn Mushroom Masala', fullPrice: 269 },
        { name: 'Mix Veg', halfPrice: 189, fullPrice: 265 },
        { name: 'Veg Hyderabadi', fullPrice: 240 },
        { name: 'Veg Kolhapuri', fullPrice: 320 },
        { name: 'Mushroom 2 Pyaza', halfPrice: 225, fullPrice: 330 },
        { name: 'Mushroom Kadhai', halfPrice: 229, fullPrice: 315 },
        { name: 'Mushroom Masala', halfPrice: 219, fullPrice: 320 },
        { name: 'Kaju Curry', fullPrice: 339 },
        { name: 'Kaju Masala', fullPrice: 230 },
        { name: 'Veg Kofta / 4 Pcs', fullPrice: 289 },
        { name: 'Malai Kofta 4 Pcs', fullPrice: 269 },
        { name: 'Sham Savera Kofta - 4 Pcs', fullPrice: 300 },
        { name: 'Kaju Kumbh Masala', fullPrice: 299 },
        { name: 'Radhe Radhe Special Mix Veg', fullPrice: 320 },
        { name: 'Kadhai Chaap', halfPrice: 225, fullPrice: 320 },
        { name: 'Jeera Aloo', fullPrice: 195 },
        { name: 'Gobhi Matar', fullPrice: 315 },
        { name: 'Soya Chaap Masala', halfPrice: 220, fullPrice: 319 },
        { name: 'Dum Aloo Banarasi', fullPrice: 299 },
        { name: 'Dum Aloo Kashmiri', fullPrice: 249 },
        { name: 'Home Style Aloo Bhujia', fullPrice: 149 },
        { name: 'Paneer Bhujia', halfPrice: 165, fullPrice: 200 },
    ];

    console.log(`Checking ${priceUpdates.length} items for price updates...`);

    const existingItems = await prisma.menuItem.findMany({
        where: { restaurantId: restaurant.id }
    });

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const update of priceUpdates) {
        // Advanced normalization: lowercase, remove non-alphas, remove common suffixes
        const normalize = (str: string) => {
            return str.toLowerCase()
                .replace(/[^a-z]/g, '')
                .replace(/halffull|pcs|pc|mini|stuff/g, '');
        };

        const targetName = normalize(update.name);

        const item = existingItems.find(i => {
            const dbName = normalize(i.name);
            return dbName === targetName || dbName.includes(targetName) || targetName.includes(dbName);
        });

        if (item) {
            // Check if price actually changed
            if (item.fullPrice !== update.fullPrice || item.halfPrice !== (update.halfPrice || null)) {
                await prisma.menuItem.update({
                    where: { id: item.id },
                    data: {
                        fullPrice: update.fullPrice,
                        halfPrice: update.halfPrice || null
                    }
                });
                console.log(`[UPDATED] ${item.name}: ₹${item.fullPrice} -> ₹${update.fullPrice}`);
                updatedCount++;
            } else {
                console.log(`[NO CHANGE] ${item.name} is already ₹${update.fullPrice}`);
            }
        } else {
            console.log(`[NOT FOUND] "${update.name}" not found in database.`);
            notFoundCount++;
        }
    }

    console.log(`\n=======================================`);
    console.log(`Update Complete!`);
    console.log(`Updated items: ${updatedCount}`);
    console.log(`Items not found/unmatched: ${notFoundCount}`);
    console.log(`Total checked: ${priceUpdates.length}`);
    console.log(`=======================================\n`);
}

updatePrices()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
