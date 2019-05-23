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

    let week = req.query.week;
    let year = req.query.year;
    let firstDay = req.query.firstDay;
    let lastDay = req.query.lastDay;

    let suggestionId = `${week}-${year}-${req.query.uid}`;

    var db = admin.firestore();
    var prefRef = db.collection("user_preferences");
    var suggestionsRef = db.collection("user_suggestions");

    suggestionsRef.doc(suggestionId).get()
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                data.meals = data.suggestions.filter(x => x.selected);
                delete data.suggestions;
                if (!data.meals.length) {
                    return res.status(200).json({ noSelection: true, week, year })
                } else {
                    return res.status(200).json(data)
                }
            } else {
                return res.status(200).json({ noSuggestions: true, week, year })
            }
        }).catch((err) => {
            res.status(500).json({
                error: err,
                foErrorMessage: "Error connecting to user_suggestions in Firebase"
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