/**
 * Seed Cards Script
 * Run with: npm run db:seed
 */

const db = require('../database/db');

const cards = [
    // ============ COMMON (60% total) ============
    {
        name: 'Blobby',
        description: 'A simple blob just vibing. Nothing special, but very huggable.',
        rarity: 'common',
        attack: 5, defense: 8, speed: 6, magic: 3,
        color_primary: '#7EC8E3', color_secondary: '#5BA3C6', color_glow: '#A8E6CF',
        shape: 'blob', drop_rate: 12.00
    },
    {
        name: 'Stick Steve',
        description: 'The OG stickman. Has been around since the dawn of MS Paint.',
        rarity: 'common',
        attack: 7, defense: 5, speed: 8, magic: 2,
        color_primary: '#2D2D2D', color_secondary: '#1A1A1A', color_glow: '#FFE66D',
        shape: 'stickman', drop_rate: 12.00
    },
    {
        name: 'Slimey Jr',
        description: 'Bouncy, squishy, and leaves a trail everywhere. Sorry about your floor.',
        rarity: 'common',
        attack: 4, defense: 10, speed: 4, magic: 4,
        color_primary: '#98D8AA', color_secondary: '#7BC98F', color_glow: '#C7F9CC',
        shape: 'slime', drop_rate: 12.00
    },
    {
        name: 'Dusty Spirit',
        description: 'A ghost that forgot how to be scary. Now just floats around awkwardly.',
        rarity: 'common',
        attack: 3, defense: 6, speed: 10, magic: 5,
        color_primary: '#E8E8E8', color_secondary: '#D0D0D0', color_glow: '#FFFFFF',
        shape: 'spirit', drop_rate: 12.00
    },
    {
        name: 'Grumpy Blob',
        description: 'Always in a bad mood. Do not ask about its day.',
        rarity: 'common',
        attack: 8, defense: 6, speed: 5, magic: 3,
        color_primary: '#FF6B6B', color_secondary: '#EE5A5A', color_glow: '#FFA07A',
        shape: 'blob', drop_rate: 12.00
    },

    // ============ UNCOMMON (25% total) ============
    {
        name: 'Ninja Stick',
        description: 'A stickman who watched too much anime. Can actually do a backflip.',
        rarity: 'uncommon',
        attack: 15, defense: 8, speed: 20, magic: 5,
        color_primary: '#1A1A2E', color_secondary: '#16213E', color_glow: '#E94560',
        shape: 'stickman', drop_rate: 6.25
    },
    {
        name: 'Crystal Blob',
        description: 'A blob infused with mystical crystals. Very shiny, very distracted by itself.',
        rarity: 'uncommon',
        attack: 10, defense: 15, speed: 8, magic: 15,
        color_primary: '#A855F7', color_secondary: '#9333EA', color_glow: '#E879F9',
        shape: 'blob', drop_rate: 6.25
    },
    {
        name: 'Lava Slime',
        description: 'Hot to the touch. Literally. Please use oven mitts.',
        rarity: 'uncommon',
        attack: 18, defense: 12, speed: 6, magic: 12,
        color_primary: '#FF4500', color_secondary: '#FF6347', color_glow: '#FFD700',
        shape: 'slime', drop_rate: 6.25
    },
    {
        name: 'Forest Wisp',
        description: 'A nature spirit that smells like fresh pine. Very calming presence.',
        rarity: 'uncommon',
        attack: 8, defense: 10, speed: 15, magic: 18,
        color_primary: '#228B22', color_secondary: '#32CD32', color_glow: '#7FFF00',
        shape: 'spirit', drop_rate: 6.25
    },

    // ============ RARE (10% total) ============
    {
        name: 'Warrior Stick',
        description: 'Armed with a pixel sword and years of animation experience.',
        rarity: 'rare',
        attack: 30, defense: 20, speed: 18, magic: 8,
        color_primary: '#B8860B', color_secondary: '#DAA520', color_glow: '#FFD700',
        shape: 'stickman', drop_rate: 3.33
    },
    {
        name: 'Royal Blob',
        description: 'Born into blob nobility. Wears a tiny crown that keeps falling off.',
        rarity: 'rare',
        attack: 15, defense: 25, speed: 12, magic: 25,
        color_primary: '#4169E1', color_secondary: '#1E90FF', color_glow: '#00BFFF',
        shape: 'blob', drop_rate: 3.33
    },
    {
        name: 'Thunder Slime',
        description: 'Zappy and unpredictable. Not recommended for people with pacemakers.',
        rarity: 'rare',
        attack: 28, defense: 15, speed: 25, magic: 20,
        color_primary: '#FFD700', color_secondary: '#FFA500', color_glow: '#FFFF00',
        shape: 'slime', drop_rate: 3.34
    },

    // ============ EPIC (4% total) ============
    {
        name: 'Shadow Assassin',
        description: 'A stickman who mastered the art of being edgy. Has a tragic backstory.',
        rarity: 'epic',
        attack: 45, defense: 20, speed: 40, magic: 25,
        color_primary: '#2F0147', color_secondary: '#1A0033', color_glow: '#9D4EDD',
        shape: 'stickman', drop_rate: 1.33
    },
    {
        name: 'Cosmic Blob',
        description: 'Contains an entire galaxy within. Very philosophical about existence.',
        rarity: 'epic',
        attack: 30, defense: 35, speed: 20, magic: 45,
        color_primary: '#0D1B2A', color_secondary: '#1B263B', color_glow: '#E0AAFF',
        shape: 'blob', drop_rate: 1.33
    },
    {
        name: 'Phoenix Spirit',
        description: 'Dies and reborns every Tuesday. Has seen things.',
        rarity: 'epic',
        attack: 40, defense: 25, speed: 35, magic: 40,
        color_primary: '#FF4500', color_secondary: '#FF6347', color_glow: '#FFD700',
        shape: 'spirit', drop_rate: 1.34
    },

    // ============ LEGENDARY (0.9% total) ============
    {
        name: 'Stick God',
        description: 'The ultimate stickman. Animator of worlds. Created the first frame.',
        rarity: 'legendary',
        attack: 70, defense: 50, speed: 60, magic: 55,
        color_primary: '#FFD700', color_secondary: '#FFA500', color_glow: '#FFFFFF',
        shape: 'stickman', drop_rate: 0.45
    },
    {
        name: 'Primordial Blob',
        description: 'The first blob. All blobs descend from this ancient goo.',
        rarity: 'legendary',
        attack: 55, defense: 70, speed: 40, magic: 70,
        color_primary: '#4B0082', color_secondary: '#8B008B', color_glow: '#FF00FF',
        shape: 'blob', drop_rate: 0.45
    },

    // ============ MYTHIC (0.1% total) ============
    {
        name: 'THE ALMIGHTY BLOBGOD',
        description: '???. Legends say it created the universe by accident while napping.',
        rarity: 'mythic',
        attack: 99, defense: 99, speed: 99, magic: 99,
        color_primary: '#FF1493', color_secondary: '#00FFFF', color_glow: '#FFFFFF',
        shape: 'blob', drop_rate: 0.05
    },
    {
        name: 'Stick Prime',
        description: 'The final evolution of all stickmen. Transcends dimensions.',
        rarity: 'mythic',
        attack: 99, defense: 99, speed: 99, magic: 99,
        color_primary: '#FFFFFF', color_secondary: '#000000', color_glow: '#FFD700',
        shape: 'stickman', drop_rate: 0.05
    }
];

// Sample users for testing
const users = [
    {
        username: 'player1',
        email: 'player1@example.com',
        password_hash: 'hashed_password_123', // In real app, this would be properly hashed
        crystals: 5000,
        vip_level: 0
    },
    {
        username: 'whaleking',
        email: 'whale@example.com',
        password_hash: 'hashed_password_456',
        crystals: 999999,
        vip_level: 10
    },
    {
        username: 'admin',
        email: 'admin@crystalgacha.com',
        password_hash: 'admin_super_secret',
        crystals: 9999999,
        vip_level: 99
    }
];

async function seedDatabase() {
    console.log('🌱 Seeding Crystal Gacha Database...\n');

    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await db.query('DELETE FROM gacha_history');
        await db.query('DELETE FROM transactions');
        await db.query('DELETE FROM user_inventory');
        await db.query('DELETE FROM banners');
        await db.query('DELETE FROM cards');
        await db.query('DELETE FROM users');

        // Seed users
        console.log('👤 Adding users...');
        for (const user of users) {
            await db.query(
                `INSERT INTO users (username, email, password_hash, crystals, vip_level) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.username, user.email, user.password_hash, user.crystals, user.vip_level]
            );
            console.log(`Added user: ${user.username}`);
        }

        // Seed cards
        console.log('\nAdding cards...');
        for (const card of cards) {
            await db.query(
                `INSERT INTO cards (name, description, rarity, attack, defense, speed, magic, 
                                   color_primary, color_secondary, color_glow, shape, drop_rate) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [card.name, card.description, card.rarity, card.attack, card.defense, 
                 card.speed, card.magic, card.color_primary, card.color_secondary, 
                 card.color_glow, card.shape, card.drop_rate]
            );
            const rarityEmoji = {
                'common': '⚪', 'uncommon': '🟢', 'rare': '🔵', 
                'epic': '🟣', 'legendary': '🟡', 'mythic': '🌈'
            };
            console.log(`   ${rarityEmoji[card.rarity]} Added: ${card.name} (${card.rarity})`);
        }

        // Give player1 some starting cards
        console.log('\nGiving starting inventory to player1...');
        const player1 = await db.query('SELECT id FROM users WHERE username = $1', ['player1']);
        const starterCards = await db.query('SELECT id FROM cards WHERE rarity = $1 LIMIT 3', ['common']);
        
        for (const card of starterCards.rows) {
            await db.query(
                `INSERT INTO user_inventory (user_id, card_id, quantity) VALUES ($1, $2, 1)`,
                [player1.rows[0].id, card.id]
            );
        }

        // Add a sample banner
        console.log('\nAdding sample banner...');
        const featuredCard = await db.query('SELECT id FROM cards WHERE rarity = $1 LIMIT 1', ['legendary']);
        await db.query(
            `INSERT INTO banners (name, description, featured_card_id, rate_up_multiplier, start_date, end_date) 
             VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')`,
            ['Legendary Blob Festival', 'Rate up for Primordial Blob!', featuredCard.rows[0].id, 2.00]
        );

        console.log('\nDatabase seeded successfully!');
        console.log('\nSummary:');
        console.log(`   • ${users.length} users created`);
        console.log(`   • ${cards.length} cards created`);
        console.log(`   • 1 active banner created`);
        console.log('\nReady to play! Start the server with: npm run dev');

    } catch (error) {
        console.error('Failed to seed database:', error);
    } finally {
        process.exit(0);
    }
}

seedDatabase();
