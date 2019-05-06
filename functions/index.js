const functions = require('firebase-functions');
const preferences = require('./controllers/preferences.js');

// Expose Express APIs as a single Cloud Function:
exports.testRecipes = functions.https.onRequest(preferences);
