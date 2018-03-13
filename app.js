'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParse = require('body-parser');
let sprintf = require('sprintf-js').sprintf;
let localize = require('localize');
let url = require('url');
let ecomMod = require('./ecomapi');
const dia = require('./dialogflow');

// firebase lib
var admin = require("firebase-admin");
var serviceAccount = require("./orderchatbot-firebase-admin.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://orderchatbot.firebaseio.com"
});

// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;

// define action on dialog.flow
const WELLCOM_ACTION = 'input.welcome';
const DEFAULT_FALLBACK_ACTION = 'input.unknown';

const OPTION_INTENT = 'option.select';

// IOT action group
const ORDER_ACTION = 'order';
const FIND_PRODUCT_ACTION = 'find_product';
const ASK_PRICE_ACTION = 'ask_price';
const ASK_TOTAL_PRICE_ACTION = 'ask_total_price';
const ASK_PRODUCT_ACTION = 'ask_product';
const PAYMENT_ACTION = 'payment';
const PROMOTIONS_ACTION = 'promotions';
const ASK_NEXT_ORDER_ACTION = 'next_order';
const MULTI_ORDER_ACTION = 'multi_order';

// start service
var ecom = new ecomMod();
setupdb();
let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParse.json({ type: 'application/json' }));

var server = app.listen(app.get('port'), function () {
    console.log('App host %s', server.address().address);
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});

app.post('/', function (request, response) {
    console.log('header: ' + JSON.stringify(request.headers));
    console.log('body: ' + JSON.stringify(response.body));
    // let accessToken = request.body.originalRequest.data.user.accessToken;
    // let userId = request.body.originalRequest.data.user.userId;

    // if (accessToken) {
    //     console.log('accessToken is ' + accessToken);
    //     console.log('userId is ' + userId);
    // }

    const app = new App({ request: request, response: response });
    // console.log('Token: ' + app.getUser().accessToken);
    // const userId = app.getUser().userId;
    // console.log(userId);


    let actionMap = new Map();
    actionMap.set(WELLCOM_ACTION, dia.welcomeHandler)
    actionMap.set(DEFAULT_FALLBACK_ACTION, dia.defaultFallbackHandler);
    actionMap.set(ORDER_ACTION, dia.orderHandler);
    actionMap.set(FIND_PRODUCT_ACTION, dia.findProductHandler);
    actionMap.set(ASK_PRICE_ACTION, dia.askPriceHandler);
    actionMap.set(ASK_TOTAL_PRICE_ACTION, dia.askTotalPriceHandler);
    actionMap.set(ASK_PRODUCT_ACTION, dia.askProductHandler);
    actionMap.set(PAYMENT_ACTION, dia.paymentHandler);
    actionMap.set(PROMOTIONS_ACTION, dia.promotionHandler);
    actionMap.set(ASK_NEXT_ORDER_ACTION, dia.askNextOrderHandler);
    actionMap.set(MULTI_ORDER_ACTION, dia.multiOrderHandler);

    // actionMap.set('pick.option', pickOption);
    // actionMap.set('actions_intent_OPTION', dia.optionPicked);
    // actionMap.set('actions.intent.OPTION', dia.optionPicked2);


    app.handleRequestAsync(actionMap).then(() => {
        console.log('Success handling GoogleAction request');
    }, (reason) => {
        console.error('Error: ' + JSON.stringify(reason));
    });
    // response.sendStatus(200); // reponse OK
});

function setupdb() {
    admin.database().ref('/').on('value', function (postSnapshot) {
        dia.dbChanged(postSnapshot);
        // if (postSnapshot.val()) {
        //     dia.drinkList = postSnapshot.val().drinklist;
        //     dia.foodList = postSnapshot.val().foodlist;
        //     dia.promotionsList = postSnapshot.val().promotions;
        // }
        console.log('firebase updated');
    });
}