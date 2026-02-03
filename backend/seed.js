import dotenv from "dotenv";
import mongoose from "mongoose";
import AuctionItem from "./models/AuctionItem.models.js";
import User from "./models/User.models.js";

dotenv.config();

// Sample auction items
const sampleItems = [
    {
        title: "Vintage Rolex Watch",
        startingPrice: 500,
        currentBid: 500,
        auctionEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        itemStatus: "LIVE",
    },
    {
        title: "MacBook Pro M3 Max",
        startingPrice: 1500,
        currentBid: 1500,
        auctionEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        itemStatus: "LIVE",
    },
    {
        title: "Sony A7 IV Camera",
        startingPrice: 800,
        currentBid: 800,
        auctionEndTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        itemStatus: "LIVE",
    },
    {
        title: "Gibson Les Paul Guitar",
        startingPrice: 1200,
        currentBid: 1200,
        auctionEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        itemStatus: "LIVE",
    },
    {
        title: "Rare Pokemon Card Set",
        startingPrice: 300,
        currentBid: 300,
        auctionEndTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        itemStatus: "LIVE",
    },
    {
        title: "Vintage Vinyl Records Collection",
        startingPrice: 200,
        currentBid: 200,
        auctionEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
        itemStatus: "LIVE",
    },
    {
        title: "iPad Pro 12.9 inch",
        startingPrice: 600,
        currentBid: 600,
        auctionEndTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        itemStatus: "LIVE",
    },
    {
        title: "Gaming PC RTX 4090",
        startingPrice: 2000,
        currentBid: 2000,
        auctionEndTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        itemStatus: "LIVE",
    },
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing auction items (optional)
        const deleteResult = await AuctionItem.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} existing auction items`);

        // Insert sample items
        const items = await AuctionItem.insertMany(sampleItems);
        console.log(`✅ Created ${items.length} auction items:`);

        items.forEach((item) => {
            console.log(`   - ${item.title} ($${item.startingPrice})`);
        });

        console.log("\n🎉 Database seeded successfully!");
        console.log("\nYou can now:");
        console.log("1. Start the server: npm run dev");
        console.log("2. Test GET /api/items to see all auctions");
        console.log("3. Create a user account via POST /api/auth/signup");
        console.log("4. Place bids via POST /api/bids or WebSocket");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();
