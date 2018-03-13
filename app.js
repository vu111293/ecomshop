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
    actionMap.set(WELLCOM_ACTION, welcomeHandler)
    actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallbackHandler);
    actionMap.set(ORDER_ACTION, orderHandler);
    actionMap.set(FIND_PRODUCT_ACTION, findProductHandler);
    actionMap.set(ASK_PRICE_ACTION, askPriceHandler);
    actionMap.set(ASK_TOTAL_PRICE_ACTION, askTotalPriceHandler);
    actionMap.set(ASK_PRODUCT_ACTION, askProductHandler);
    actionMap.set(PAYMENT_ACTION, paymentHandler);
    actionMap.set(PROMOTIONS_ACTION, promotionHandler);

    // actionMap.set('pick.option', pickOption);
    actionMap.set('actions_intent_OPTION', optionPicked);
    actionMap.set('actions.intent.OPTION', optionPicked2);


    app.handleRequestAsync(actionMap).then(() => {
        console.log('Success handling GoogleAction request');
    }, (reason) => {
        console.error('Error: ' + JSON.stringify(reason));
    });
    // response.sendStatus(200); // reponse OK
});

var drinkList;
var foodList;
var promotionsList;

function setupdb() {
    admin.database().ref('/').on('value', function (postSnapshot) {
        if (postSnapshot.val()) {
            drinkList = postSnapshot.val().drinklist;
            foodList = postSnapshot.val().foodlist;
            promotionsList = postSnapshot.val().promotions;
        }
        console.log('firebase updated');
    });
}

let getStartList = function (app) {
    let list = app.buildList('Start Game or Instructions');
    list.addItems([
        app.buildOptionItem('start_game', ['Start', 'New Game']).setTitle('Start Game'),
        app.buildOptionItem('instruction', ['Help', 'Read Instructions', 'Tell Me Instructions', 'Repeat Instructions']).setTitle('Instructions')
    ]);
    return list;
};

function welcomeHandler(app) {
    app.ask("Shop xin kính chào quí khách");
}

function defaultFallbackHandler(app) {
    app.ask("Xin lỗi yêu cầu không thể thực hiện. Xin thực hiện lại");
}

function findProductHandler(app) {
    // push menu options
    app.ask('Quý khách vui lòng tham khảo thực đơn trên màn hình');
}

function orderHandler(app) {
    let productName = app.getArgument('product');
    let quantily = app.getArgument('quantily');
    let quantilyNonFormat = app.getArgument('quantily-nonformat');
    let size = app.getArgument('size_model');
    let sugar = app.getArgument('sugar_model');
    let ice = app.getArgument('ice_model');

    var product;

    let askPreProduct = app.getArgument('ask_preproduct');
    let askPostProduct = app.getArgument('ask_product');

    var ask = '';

    do {
        if (!quantily && askPreProduct && askPostProduct && productName) {
            let foundProduct = findProduct(productName.toLowerCase());
            if (foundProduct) {
                ask = 'Có ' + foundProduct.name + ' bạn nha. Bạn muốn mua mấy ly?'
                break;
            }
        }

        let googleContext = app.getContext('_actions_on_google_');
        if (googleContext) {
            if (!googleContext.parameters.product && googleContext.parameters.product_ask) {
                googleContext.parameters.product = googleContext.parameters.product_ask;
                productName = googleContext.parameters.product;
                app.setContext(googleContext.name, googleContext.lifespan, googleContext.parameters);
            }
        }

        if (productName == null) {
            ask = 'Bạn muốn mua gì?';
            break;
        }

        // let context = app.getContext('ask-product-context');
        // if (context != null || product == null) {
        //     // check context
        //     if (context == null) {
        //         ask = 'Bạn muốn mua gì?';
        //         break;
        //     }

        //     let cacheProduct = context.parameters.product_ask;
        //     if (cacheProduct == null) {
        //         ask = 'Bạn muốn mua gì?';
        //         break;
        //     }

        //     product = cacheProduct;
        // }

        product = findProduct(productName.toLowerCase());
        if (product == null) {
            ask = 'Hiện tại shop không bán ' + productName + '. Xin chọn sản phẩm khác';
            break;
        }
        productName = product.name;

        if (quantily != null) {

        } else if (quantilyNonFormat != null) {
            quantily = quantilyNonFormat;
        } else {
            quantily = 1;
        }

        if (size == null) {
            size = "medium";
        }

        let options = product.options;
        console.log("Product found: " + JSON.stringify(product));
        console.log("Options: " + JSON.stringify(options));

        if (sugar == null && options.includes('sugar')) {
            ask += "Bạn muốn ít hay nhiều đường";
            break;
        }

        if (ice == null && options.includes('ice')) {
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
            'name': product.name,
            'quantily': quantily,
            'size': size,
            'sugar': sugar,
            'ice': ice,
            'price': product.price * quantily
        }

        app.data.orderList.push(bill);
        // resetContext(app);
        app.ask('Đã thêm ' + product.name + ' vào hóa đơn. Bạn muốn mua gì thêm không?');
    }
}

function askPriceHandler(app) {
    let product = app.getArgument('product');
    if (product == null) {
        app.ask('Bạn muốn hỏi giá sản phẩm nào?');
        return;
    }

    let foundItem = findProduct(product.toLowerCase());
    if (foundItem) {
        app.ask(foundItem.name + ' có giá ' + foundItem.price);
    } else {
        app.ask('Không tìm thấy sản phẩm. Xin thử lại');
    }
}

function askTotalPriceHandler(app) {
    if (app.data.orderList == null) {
        app.ask('Quý khách hiện chưa gọi món, vui lòng gọi món tại đây.');
        return;
    }

    var totalPrice = 0;
    var options = [];
    for (var i = 0; i < app.data.orderList.length; ++i) {
        var product = app.data.orderList[i];
        totalPrice += parseInt(product.price);

        options.push({
            'title': product.name,
            'type': 'SL: ' + product.quantily,
            'value': product.price * product.quantily
        });
    }

    addOptionsContext(app, options);
    app.ask('Tổng giá ' + totalPrice + ' đồng. Quý khách xem chi tiết hóa đơn trên màn hình');
}

function askProductHandler(app) {
    let product = app.getArgument('product_ask');
    if (product) {
        let foundProduct = findProduct(product.toLowerCase());
        let ask;
        if (foundProduct) {

            // add product to context
            let googleContext = app.getContext('_actions_on_google_');
            if (googleContext) {
                googleContext.parameters.product = product;
                app.setContext(googleContext.name, googleContext.lifespan, googleContext.parameters);
            }
            ask = 'Có bán ' + product + ' bạn nha. Bạn muốn mua bao nhiêu ly?';
        } else {
            ask = 'Hiện tại shop không bán ' + product + '. Xin chọn sản phẩm khác';
        }
        app.ask(ask);
    } else {
        app.ask('Bạn muốn hỏi sản phẩm nào?');
    }
}

function paymentHandler(app) {
    ecom.makeOrder(function (response) {
        if (response) {
            // parse result
            let totalPrice = response.total_price;
            let address = response.address;
            let time = response.created_at;
            let id = response.id.substring(0, 5) + '...' + response.id.substring(response.id.length - 5);
            app.tell('Bill ' + id + ' đã tạo thành công. Tổng bill là ' + totalPrice + ', được giao đến ' + address);
        } else {
            app.ask('Xãy ra lỗi khi thanh toán');
        }
    });
}

function promotionHandler(app) {
    if (promotionsList == null) {
        app.ask("Hiện tại shop chưa có chương trình khuyến mãi. Cảm ơn quý khách đã quan tâm");
    } else {
        var options = [];
        var promotionDraft = '';

        for (let item in promotionsList) {
            promotionDraft += promotionsList[item] + "\n";
            options.push({
                'title': promotionsList[item],
                'type': 'tylemode',
                'value': 120
            });
        }

        addOptionsContext(app, options);
        app.ask("Quý khách tham khảo chương trình khuyến mãi trên màn hình");
    }
}

function pickOption(app) {
    if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
        app.askWithCarousel('Which of these looks good?',
            app.getIncomingCarousel().addItems(
                app.buildOptionItem('another_choice', ['Another choice']).
                    setTitle('Another choice').setDescription('Choose me!')));
    } else {
        app.ask('What would you like?');
    }
}

function optionPicked(app) {

    app.ask('You picked ' + app.getSelectedOption());
}

function optionPicked2(app) {

    app.ask('You picked ' + app.getSelectedOption());
}

// support method
function findProduct(productname) {
    var foundItem;
    for (let key in drinkList) {
        let item = drinkList[key];
        if (item.replacename == null) {
            continue;
        }
        let nameList = item.replacename.split(',');
        for (let index in nameList) {
            let name = nameList[index];
            if (productname.includes(name) == false) {
                continue;
            }
            foundItem = item;
            break;
        }
        if (foundItem != null) {
            break;
        }
    }

    return foundItem;
}

function resetContext(app) {
    let contexts = app.getContexts();
    for (let i in contexts) {
        app.setContext(contexts[i].name, 0, null);
    }
}

function addOptionsContext(app, options) {
    const params = {};
    params['options'] = options;
    app.setContext('local-ui-options', 1, params);
}

function addConfirmContext(content) {

}

function addGalleryContext(list) {

}