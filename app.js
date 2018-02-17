'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParse = require('body-parser');
let sprintf = require('sprintf-js').sprintf;
let localize = require('localize');
let url = require('url');

// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;

// define action on dialog.flow
const WELLCOM_ACTION = 'input.welcome';
const DEFAULT_FALLBACK_ACTION = 'input.unknown';

// IOT action group
const ORDER_ACTION = 'order';
const FIND_PRODUCT_ACTION = 'find_product';
const ASK_PRICE_ACTION = 'ask_price';
const ASK_TOTAL_PRICE_ACTION = 'ask_total_price';
const CHECK_PRODUCT_ACTION = 'check_product';


let actionMap = new Map();
actionMap.set(WELLCOM_ACTION, welcomeHandler)
actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallbackHandler);
actionMap.set(ORDER_ACTION, orderHandler);
actionMap.set(FIND_PRODUCT_ACTION, findProductHandler);
actionMap.set(ASK_PRICE_ACTION, askPriceHandler);
actionMap.set(ASK_TOTAL_PRICE_ACTION, askTotalPriceHandler);
actionMap.set(CHECK_PRODUCT_ACTION, checkProductHandler);


// start service
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

    app.handleRequest(actionMap);
    // response.sendStatus(200); // reponse OK
});

function welcomeHandler(app) {
    app.ask("ECom Shop xin kính chào quý khách. Hiện shop có chương trình đồng giá 25k.");
}

function defaultFallbackHandler(app) {
    app.ask("Xin lỗi yêu cầu không thể thực hiện. Xin thực hiện lại");
}

function findProductHandler(app) {
    app.ask('Hi bạn. Hiện tại shop bán các loại thức uống và trà sữa. Bạn cần gì ạ');
}

function orderHandler(app) {
    let product = app.getArgument('product');
    let quantily = app.getArgument('quantily');
    let size = app.getArgument('size_model');
    let sugar = app.getArgument('sugar_model');
    let ice = app.getArgument('ice_model');

    let askPreProduct = app.getArgument('ask_preproduct');
    let askPostProduct = app.getArgument('ask_product');

    var ask = '';

    do {
        if (askPreProduct && askPostProduct && product) {
            ask = 'Có bán ' + product + ' bạn nha. ';
            console.log('call here @@@');
        }

        if (product == null) {
            ask = "Bạn muốn mua gì?";
            break;
        }

        if (quantily == null) {
            quantily = 1;
        }

        if (size == null) {
            size = "medium";
        }

        if (sugar == null) {
            ask += "Bạn muốn ít hay nhiều đường";
            break;
        }

        if (ice == null) {
            ask += "Bạn muốn ít hay nhiều đá";
            break;
        }
    } while (false);

    if (ask) {
        app.ask(ask);
    } else {
        if (app.data.orderList == null) {
            app.data.orderList = [];
        }

        let bill = {
            'name': product,
            'quantily': quantily,
            'size': size,
            'sugar': sugar,
            'ice': ice
        }

        app.data.orderList.push(bill);
        app.ask('Bạn đã order: ' + JSON.stringify(bill));
    }
}

function askPriceHandler(app) {
    let product = app.getArgument('product');

    if (product == null) {
        app.ask('Bạn muốn hỏi giá sản phẩm nào?');
        return;
    }

    app.ask(product + ' có giá 25k');
}

function askTotalPriceHandler(app) {
    if (app.data.orderList == null) {
        app.ask('Bạn chưa có sản phẩm nào trong giỏ.');
        return;
    }

    var amount = 0;
    for (var i = 0; i < app.data.orderList.length; ++i) {
        amount += parseInt(app.data.orderList[i].quantily);
    }
    app.ask('Bạn đã mua ' + amount + ' sản phẩm. Tổng giá ' + (amount * 25) + 'k');
}

function checkProductHandler(app) {
    let product = app.getArgument('product');
    if (product) {
        app.ask('Có bán ' + product + ' bạn nha.');
    } else {
        app.ask('Bạn muốn hỏi sản phẩm nào?');
    }

}