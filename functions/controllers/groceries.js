// const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const configs = require('../configs-active.js');

const app = express();
app.use(cors({ origin: true }));

// TODO: Add middleware to authenticate requests

// Spoonacular Get APIs
const spoonUrlInfoBulk = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk';
const spoonHeader = configs.spoonConfigs;


//THIS CONTROLLER HANDLES RECIPE SUGGESTIONS
//Methods: Get, Patch
app.get('/', (req, res) => {

    let week = req.query.week;
    let year = req.query.year;
    let firstDay = req.query.firstDay;
    let lastDay = req.query.lastDay;

    let docId = `${week}-${year}-${req.query.uid}`;


    var db = admin.firestore();
    var grocRef = db.collection("user_groceries");
    var suggestionsRef = db.collection("user_suggestions");

    let ingredients = [];

    let getBreakChainError = () => {
        let err = new Error();
        err.name = 'BreackChainError';
        return err;
    };

    grocRef.doc(docId).get()
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                res.status(200).json(data);
                throw getBreakChainError(); //terminate the chain early
            } else {
                return suggestionsRef.doc(docId).get()
            }
        })
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                let meals = data.suggestions.filter(x => x.selected);
                let ids = [];
                meals.forEach((el) => {
                    ids.push(el.id)
                })
                return ids.join()
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

            response.data.forEach(meal => {
                Array.prototype.push.apply(ingredients, meal.extendedIngredients);
            });
            ingredients.forEach((el, i) => {
                ingredients[i].cart = true;
                ingredients[i].weekIngId = i;
            });

            return grocRef.doc(docId).set({ ingredients, week, year })
        })
        .then((doc) => {
            return res.status(200).json({ ingredients, week, year });
        })
        .catch((err) => {
            if (err.name !== 'BreackChainError') {
                res.status(500).json({
                    error: err
                });
            }
        });
});

app.put('/', (req, res) => {
    // TODO make this patch work
    let { ingredients, uid, week, year } = req.body;

    let docId = `${week}-${year}-${uid}`;
    var db = admin.firestore();
    var grocRef = db.collection("user_groceries");


    grocRef.doc(docId).update({ ingredients })
        .then((doc) => {
            res.status(200).json({ success: true });
        })
        .catch((err) => {
            res.status(500).json({
                error: err
            });
        });

});
module.exports = app