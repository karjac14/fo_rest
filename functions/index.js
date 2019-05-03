const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const configs = require('./configs.js');


// TODO: Add middleware to authenticate requests

// Edamam Get APIs
const edPath = 'https://api.edamam.com/search';
const edParams = configs.edamamConfigs;

// Edamam Get APIs
const spoonUrl = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex';
const spoonHeader = configs.spoonConfigs;

// build multiple CRUD interfaces:

exports.recipes = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // if (req.method !== "GET") {
        //     return res.status(401).json({
        //         message: "Not allowed"
        //     });
        // }
        let data = {
            limitLicense: false,
            offset: 0,
            number: 12,
            query: "burger",
            minCalories: 150,
            maxCalories: 2000
        };

        let config = {
            headers: spoonHeader,
            params: data
        };





        return axios.get(spoonUrl, config)
            .then(response => {
                return res.status(200).json({ data: response.data })
            })
            .catch(err => {
                console.log(err);
                return res.status(500).json({
                    error: err
                })
            })

    })
});



exports.recipes2 = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // if (req.method !== "GET") {
        //     return res.status(401).json({
        //         message: "Not allowed"
        //     });
        // }

        let allParams = Object.assign(edParams, { q: "all", yield: 4 })

        return axios.get(edPath, {
            params: allParams
        })
            .then(response => {
                return res.status(200).json({ data: response.data.hits })
            })
            .catch(err => {
                return res.status(500).json({
                    error: err
                })
            })

    })
});



