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
const spoonUrlInfoBulk = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk';
const spoonHeader = configs.spoonConfigs;

let getBreakChainError = () => {
    let err = new Error();
    err.name = 'BreackChainError';
    return err;
};


//THIS CONTROLLER HANDLES RECIPE SUGGESTIONS
//Methods: Get, Post
app.get('/', (req, res) => {

    let week = req.query.week;
    let year = req.query.year;
    let firstDay = req.query.firstDay;
    let lastDay = req.query.lastDay;

    let docId = `${week}-${year}-${req.query.uid}`;

    var db = admin.firestore();
    var prefRef = db.collection("user_preferences");
    var suggestionsRef = db.collection("user_suggestions");
    var recipesRef = db.collection("user_recipes");

    let meals;

    recipesRef.doc(docId).get()
        .then((doc) => {
            if (doc.exists) {
                console.log("exists")
                let data = doc.data();
                res.status(200).json(data);
                throw getBreakChainError(); //terminate the chain early
            } else {
                console.log("not exists")
                return suggestionsRef.doc(docId).get()
            }
        })
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                let selectedMeals = data.suggestions.filter(x => x.selected);

                if (selectedMeals.length === 0) {
                    res.status(200).json({ noSelection: true, week, year })
                    throw getBreakChainError(); //terminate the chain early
                } else {
                    let ids = [];
                    selectedMeals.forEach((el) => {
                        ids.push(el.id)
                    })
                    return ids.join()
                }
            } else {
                res.status(200).json({ noSuggestions: true, week, year })
                throw getBreakChainError(); //terminate the chain early
            }
        })
        .then((idsStr) => {

            let spoonData = {
                ids: idsStr
            };
            let spoonConfig = {
                headers: spoonHeader,
                params: spoonData
            };
            return axios.get(spoonUrlInfoBulk, spoonConfig)
        })
        .then(response => {

            meals = response.data;
            return recipesRef.doc(docId).set({ meals, week, year })
        })
        .then((doc) => {
            return res.status(200).json({ meals, week, year });
        }).catch((err) => {
            if (err.name !== 'BreackChainError') {
                res.status(500).json({
                    error: err
                });
            }
        });
});

module.exports = app