// const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const moment = require('moment');


const configs = require('../configs.js');

const app = express();
app.use(cors({ origin: true }));

// admin.initializeApp(functions.config().firebase);
// var db = admin.firestore();
// var prefRef = db.collection("user_preferences");
// var weeklyRef = db.collection("user_weekly");


// TODO: Add middleware to authenticate requests


// Edamam Get APIs
const spoonUrl = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex';
const spoonHeader = configs.spoonConfigs;


//THIS CONTROLLER HANDLES USERS RECIPE PREFERENCES
//Methods: Get, Post



app.get('/choose/', (req, res) => {



    let week = moment().week();
    let year = moment().year();

    var db = admin.firestore();
    var prefRef = db.collection("user_preferences");
    var weeklyRef = db.collection("user_weekly");

    let id = `${week}-${year}-${req.query.uid}`



    weeklyRef.doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                let suggestions = doc.data();
                return res.status(200).json(suggestions)
            } else {
                return "empty"
            }
        }).then(() => {

            return prefRef.doc(req.query.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        let preferences = doc.data();
                        return preferences;
                    } else {
                        return res.status(200).json({ preferences: null });
                    }
                }).catch((error) => {

                    return res.status(500).json(error);
                });
        }).then((preferences) => {

            console.log(preferences);

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
                number: 12,
                type: "main course",
                diet,
                instructionsRequired: true,
                addRecipeInformation: true,
                intolerances: filtersStr
            };

            let spoonConfig = {
                headers: spoonHeader,
                params: spoonData
            };

            console.log("yo");

            return axios.get(spoonUrl, spoonConfig)
                .then(response => {
                    //TODO: Save the results to db, for easy fetching later
                    return res.status(200).json(response.data);
                })
                .catch(err => {
                    return res.status(500).json({
                        error: err
                    });
                });

        }).catch((err) => {
            return res.status(500).json({
                error: err
            })
        });
});
app.post('/choose/', (req, res) => {

});

module.exports = app