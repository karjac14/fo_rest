// const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const moment = require('moment');
const configs = require('../configs-active.js');

const app = express();
app.use(cors({ origin: true }));

// TODO: Add middleware to authenticate requests

// Spoonacular Get APIs
const spoonUrl = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex';
const spoonHeader = configs.spoonConfigs;


//THIS CONTROLLER HANDLES RECIPE SUGGESTIONS
//Methods: Get, Post
app.get('/', (req, res) => {

    console.log(req.headers);


    var db = admin.firestore();
    var prefRef = db.collection("user_preferences");
    var suggestionsRef = db.collection("user_suggestions");

    let week = req.query.week;
    let year = req.query.year;
    let firstDay = req.query.firstDay;
    let lastDay = req.query.lastDay;

    let suggestionId = `${week}-${year}-${req.query.uid}`;



    suggestionsRef.doc(suggestionId).get()
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                return res.status(200).json(data)
            }

            prefRef.doc(req.query.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        let preferences = doc.data();

                        let count = preferences.dishCountFilters.options.filter(el => el.selected)[0].value;
                        let diet = preferences.dietFilters.options.filter(el => el.selected)[0].value;
                        let filters = [];

                        preferences.moreFilters.options.forEach(el => {
                            if (el.selected) {
                                filters.push(el.value);
                            }
                        });
                        let filtersStr = filters.toString()

                        var suggestionsCount = 12;
                        var offset = Math.floor(Math.random() * (max[diet] - 1)) + 1;

                        let spoonData = {
                            limitLicense: false,
                            offset, //random offset number to have different suggestions every week
                            number: suggestionsCount,
                            type: "main course",
                            diet: diet !== "No Diet" ? diet : "",
                            instructionsRequired: true,
                            addRecipeInformation: true,
                            intolerances: filtersStr
                        };

                        let spoonConfig = {
                            headers: spoonHeader,
                            params: spoonData
                        };

                        axios.get(spoonUrl, spoonConfig)
                            .then(response => {

                                if (!response.data.results.length) {
                                    return res.status(500).json({
                                        foErrorMessage: "No results from API"
                                    });
                                }

                                let suggestions = response.data.results.map(obj => {
                                    var rObj = obj;
                                    rObj.selected = false;
                                    return rObj;
                                });

                                suggestionsRef.doc(suggestionId).set({ suggestions: suggestions, week, year, firstDay, lastDay, offset })
                                    .then((doc) => {
                                        return res.status(200).json({ suggestions: suggestions, week, year, firstDay, lastDay, offset, count, newWeek: true });
                                    }).catch((err) => {
                                        return res.status(500).json({
                                            error: err,
                                            foErrorMessage: "Error saving in user_suggestions in Firebase"
                                        });
                                    });
                            })
                            .catch(err => {
                                return res.status(500).json({
                                    error: err,
                                    foErrorMessage: "Error fetching recipes from API",
                                    foErrorParams: spoonData
                                });
                            });

                    } else {
                        return res.status(200).json({ preferences: false });
                    }
                }).catch((err) => {
                    return res.status(500).json({
                        error: err,
                        foErrorMessage: "Error fetching preferences in firebase"
                    });
                });

        }).catch((err) => {
            res.status(500).json({
                error: err,
                foErrorMessage: "Error connecting to user_suggestions in Firebase"
            });
        });
});

app.post('/', (req, res) => {

    console.log(req.headers);

    var db = admin.firestore();
    var suggestionsRef = db.collection("user_suggestions");
    let { uid } = req.body;

    let week = req.body.week;
    let year = req.body.year;


    let suggestionId = `${week}-${year}-${uid}`;

    suggestionsRef.doc(suggestionId).set(req.body)
        .then((doc) => {
            return res.status(200).json({});
        }).catch((err) => {
            return res.status(500).json({
                error: err,
                foErrorMessage: "Error saving in user_suggestions in Firebase"
            });
        });



});


//due to the flaws of the recipe api, we cant rely on the total results value, so for now, limit the random offset to this max enum
//later on, when the recipe api is fixed, used the total results as max.
let max = {
    vegan: 90,
    pescatarian: 250,
    vegetarian: 100,
    paleo: 190,
    ketogenic: 30,
    "whole 30": 200,
    "No Diet": 240
};

module.exports = app