const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const preferences = require('./controllers/preferences.js');
const suggestions = require('./controllers/suggestions.js');
const meals = require('./controllers/meals.js');
const groceries = require('./controllers/groceries.js');
const status = require('./controllers/status.js');


// Expose Express APIs as Cloud Functions
exports.preferences = functions.https.onRequest(preferences);
exports.suggestions = functions.https.onRequest(suggestions);
exports.meals = functions.https.onRequest(meals);
exports.groceries = functions.https.onRequest(groceries);
exports.status = functions.https.onRequest(status);