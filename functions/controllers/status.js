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
    var prefRef = db.collection("user_preferences");
    var suggestionsRef = db.collection("user_suggestions");

    let hasPreferences = false;
    let hasChosen = false;

    let getBreakChainError = () => {
        let err = new Error();
        err.name = 'BreackChainError';
        return err;
    };

    prefRef.doc(req.query.uid).get()
        .then((doc) => {
            if (doc.exists) {
                hasPreferences = true;
                return suggestionsRef.doc(docId).get()
            } else {
                res.status(200).json({ hasPreferences: false, hasChosen: false, week, year });
                throw getBreakChainError(); //terminate the chain early
            }
        })
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                data.suggestions.forEach(el => {
                    if (el.selected) {
                        hasChosen = true;
                    }
                });
                return res.status(200).json({ hasPreferences, hasChosen, week, year });
            }
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