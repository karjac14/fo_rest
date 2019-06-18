const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: true }));

// TODO: Add middleware to authenticate requests

//THIS CONTROLLER HANDLES USER STATUS
//Methods: Get
app.get('/', (req, res) => {

    let week = req.query.week;
    let year = req.query.year;
    let docId = `${week}-${year}-${req.query.uid}`;
    var db = admin.firestore();
    var prefRef = db.collection("user_preferences").doc(docId);
    var suggestionsRef = db.collection("user_suggestions").doc(docId);

    Promise.all([prefRef.get(), suggestionsRef.get()])
        .then(result => {
            console.log(result)
            let hasPreferences, hasSuggestions;
            if (result[0].exists) {
                hasPreferences = true;
            }
            if (result[1].exists) {
                let data = result[1].data();
                data.suggestions.forEach(el => {
                    if (el.selected) {
                        hasSuggestions = true;
                    }
                });
            }
            return res.status(200).json({ hasPreferences, hasSuggestions, week, year });
        })
        .catch((err) => {
            if (err.name !== 'BreackChainError') {
                res.status(500).json({
                    error: err
                });
            }
        });
});


module.exports = app