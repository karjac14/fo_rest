const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const configs = require('../configs.js');

const app = express();
app.use(cors({ origin: true }));

admin.initializeApp(functions.config().firebase);
var db = admin.firestore();
var prefRef = db.collection("user_preferences");


// TODO: Add middleware to authenticate requests

// Edamam Get APIs
const edPath = 'https://api.edamam.com/search';
const edParams = configs.edamamConfigs;

// Edamam Get APIs
const spoonUrl = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex';
const spoonHeader = configs.spoonConfigs;


//THIS CONTROLLER HANDLES USERS RECIPE PREFERENCES
//Methods: Get, Post



app.get('/', (req, res) => {


    db.collection("user_preferences").doc(req.query.uid).get()
        .then((doc) => {
            if (doc.exists) {
                let db_preferences = doc.data();
                return db_preferences;
            } else {
                return res.status(200).json({ data: [], preferences: null })
            }
        }).then((preferences) => {

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


            return axios.get(spoonUrl, spoonConfig)
                .then(response => {
                    return res.status(200).json({ data: response.data });
                })
                .catch(err => {
                    return res.status(500).json({
                        error: err
                    });
                });

        }).catch((error) => {
            return res.status(500).json({
                error: err
            })
        });


});
app.post('/', (req, res) => {

});

module.exports = app