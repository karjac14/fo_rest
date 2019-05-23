// const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const configs = require('../configs-active.js');

const app = express();
app.use(cors({ origin: true }));

// TODO: Add auth middleware to authenticate requests

// Edamam Get APIs
const spoonUrl = configs.spoonUrl;
const spoonHeader = configs.spoonConfigs;


//THIS CONTROLLER HANDLES USERS RECIPE PREFERENCES
//Methods: Get, Post

app.get('/', (req, res) => {

    var db = admin.firestore();
    var prefRef = db.collection("user_preferences");

    prefRef.doc(req.query.uid).get()
        .then((doc) => {
            if (doc.exists) {
                let preferences = doc.data();
                return res.status(200).json(preferences);
            } else {
                return res.status(200).json(null);
            }
        }).catch((error) => {
            return res.status(500).json(error);
        });


});
app.post('/', (req, res) => {

    let { preferences, uid, week, year } = req.body;

    let count = preferences.dishCountFilters.options.filter(el => el.selected)[0].value;
    let diet = preferences.dietFilters.options.filter(el => el.selected)[0].value;

    let filters = [];
    preferences.moreFilters.options.forEach(el => {
        if (el.selected) {
            filters.push(el.value);
        }
    });
    let filtersStr = filters.toString()

    let spoonData = {
        limitLicense: false,
        offset: 0,
        number: 1,
        type: "main course",
        diet,
        intolerances: filtersStr
    };
    let spoonConfig = {
        headers: spoonHeader,
        params: spoonData
    };

    //test max totalresults of recipes
    axios.get(spoonUrl, spoonConfig)
        .then(response => {
            return response.data.totalResults;
        })
        .then(totalResults => {
            //then save the preferences to db 

            var db = admin.firestore();
            var prefRef = db.collection("user_preferences");
            var suggestionsRef = db.collection("user_suggestions");

            let suggestionId = `${week}-${year}-${uid}`;

            preferences.totalResults = totalResults;
            preferences.count = count;
            return prefRef.doc(uid).set(preferences)
                .then((doc) => {

                    // delete the current week's weekly suggestion, whenver new preference is saved
                    return suggestionsRef.doc(suggestionId).delete().then(function () {
                        return res.status(200).json({ totalResults: totalResults });
                    }).catch(function (error) {
                        console.error("Error removing document: ", error);
                        return res.status(200).json({ totalResults: totalResults });
                    });

                }).catch((err) => {
                    return res.status(500).json({
                        error: err
                    })
                });

        })
        .catch(err => {
            return res.status(500).json({
                error: err
            });
        });
});

module.exports = app