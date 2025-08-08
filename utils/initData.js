const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const News = require('../models/News');
const Match = require('../models/Match');
const Highlight = require('../models/Highlight');
const Competitor = require('../models/Competitor');

// Import data from JSON files
const tournamentsData = require('../data/tournaments.json');
const usersData = require('../data/users.json');
const newsData = require('../data/news.json');
const matchesData = require('../data/matches.json');
const highlightsData = require('../data/highlights.json');
const competitorsData = require('../data/competitors.json');

require('dotenv').config();

const initDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Clear existing data
        await Tournament.deleteMany({});
        console.log('Cleared existing tournaments');

        // Insert tournaments
        const tournaments = await Tournament.insertMany(tournamentsData);
        console.log(`Inserted ${tournaments.length} tournaments`);

        // Try to insert other data but don't fail if there are errors
        try {
            await User.deleteMany({});
            const users = await User.insertMany(usersData);
            console.log(`Inserted ${users.length} users`);
        } catch (error) {
            console.log('Skipped users insertion due to error:', error.message);
        }

        try {
            await Competitor.deleteMany({});
            const competitors = await Competitor.insertMany(competitorsData);
            console.log(`Inserted ${competitors.length} competitors`);
        } catch (error) {
            console.log('Skipped competitors insertion due to error:', error.message);
        }

        try {
            await News.deleteMany({});
            const news = await News.insertMany(newsData);
            console.log(`Inserted ${news.length} news`);
        } catch (error) {
            console.log('Skipped news insertion due to error:', error.message);
        }

        try {
            await Match.deleteMany({});
            const matches = await Match.insertMany(matchesData);
            console.log(`Inserted ${matches.length} matches`);
        } catch (error) {
            console.log('Skipped matches insertion due to error:', error.message);
        }

        try {
            await Highlight.deleteMany({});
            const highlights = await Highlight.insertMany(highlightsData);
            console.log(`Inserted ${highlights.length} highlights`);
        } catch (error) {
            console.log('Skipped highlights insertion due to error:', error.message);
        }

        console.log('Database initialization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

// Run if this file is executed directly
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;
