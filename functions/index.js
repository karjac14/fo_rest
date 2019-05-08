const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp(functions.config().firebase);
// var db = admin.firestore();


const app = express();


// app.use(cors({ origin: true }));
app.use(require('./controllers/preferences.js'));
app.use(require('./controllers/choose.js'));


// Expose Express APIs as a single Cloud Function:
exports.v1 = functions.https.onRequest(app);
