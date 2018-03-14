
const conf = require('./configure');

let drinkList;
let foodList;
let promotionsList;

let admin = require("firebase-admin", conf.SERVER_KEY_PATH);
let serviceAccount = require(conf.SERVER_KEY_PATH);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: conf.FIREBASE_URL
});

admin.database().ref('/').on('value', function (postSnapshot) {
    dbChanged(postSnapshot);
    console.log('firebase updated');
});


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
    let quantity = app.getArgument('quantily');
    let quantilyNonFormat = app.getArgument('quantily-nonformat');
    let size = app.getArgument('size_model');
    let sugar = app.getArgument('sugar_model');
    let ice = app.getArgument('ice_model');

    var product;

    let askPreProduct = app.getArgument('ask_preproduct');
    let askPostProduct = app.getArgument('ask_product');

    var ask = '';

    do {
        if (!quantity && askPreProduct && askPostProduct && productName) {
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
        product = findProduct(productName.toLowerCase());
        if (product == null) {
            ask = 'Hiện tại shop không bán ' + productName + '. Xin chọn sản phẩm khác';
            break;
        }
        productName = product.name;

        if (quantity != null) {

        } else if (quantilyNonFormat != null) {
            quantity = quantilyNonFormat;
        } else {
            quantity = 1;
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
        // if (app.data.orderList == null) {
        //     app.data.orderList = [];
        // }

        // let bill = {
        //     'name': product.name,
        //     'quantily': quantity,
        //     'size': size,
        //     'sugar': sugar,
        //     'ice': ice,
        //     'price': product.price * quantity
        // }

        // app.data.orderList.push(bill);
        let bill = createBill(product.name, quantity, size, sugar, ice, product.price);
        addBillToWishlist(app, bill);
        // resetContext(app);
        app.setContext('next-order-context', 1, null);
        buildOrderConfirm(app, bill);
    }
}

function multiOrderHandler(app) {
    let productLs = [];
    var billLs = [];
    let prNotFound;
    for (var i = 1; i <= 3; ++i) {
        if (!app.getArgument('product0' + i)) {
            continue;
        }

        let name = app.getArgument('product0' + i);
        let product = findProduct(name);
        if (!product) {
            prNotFound = name;
            break;
        }
        let quantity = app.getArgument('num0' + i) ? app.getArgument('num0' + i) : 1;
        billLs.push(createBill(product.name, quantity, 'medium', 'medium', 'medium', product.price));
    }

    if (prNotFound) {
        app.ask('Hiện tại shop không bán ' + prNotFound + '. Xin vui lòng chọn sản phẩm khác');
    } else {
        if (billLs.length == 0) {
            app.ask('Quý khách muốn mua gì?')
        } else {
            addBillToWishlist(app, billLs);
            buildOrderConfirm(app, billLs);
        }
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
    sendNewBill(app.data.orderList);
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
    app.ask('Hiện tại tính năng này đang hoàn thiện.');
    // ecom.makeOrder(function (response) {
    //     if (response) {
    //         // parse result
    //         let totalPrice = response.total_price;
    //         let address = response.address;
    //         let time = response.created_at;
    //         let id = response.id.substring(0, 5) + '...' + response.id.substring(response.id.length - 5);
    //         app.tell('Bill ' + id + ' đã tạo thành công. Tổng bill là ' + totalPrice + ', được giao đến ' + address);
    //     } else {
    //         app.ask('Xãy ra lỗi khi thanh toán');
    //     }
    // });
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

function askNextOrderHandler(app) {
    let confirm = app.getArgument('confirm');
    if (confirm) {
        if (confirm == 'yes') {
            app.ask("Mời bạn chọn món kế tiếp");
        } else {
            askTotalPriceHandler(app);
        }
    } else {
        app.setContext('next-order-context', 1, null);
        app.ask('Bạn muốn mua gì thêm không?');
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

function dbChanged(postSnapshot) {
    if (postSnapshot.val()) {
        drinkList = postSnapshot.val().drinklist;
        foodList = postSnapshot.val().foodlist;
        promotionsList = postSnapshot.val().promotions;
    }
}

// support method
let buildOrderConfirm = function (app, bill) {
    let strProducts = '';
    if (bill instanceof Array) {
        strProducts = bill[0].name;
        for (var i = 1; i < bill.length; ++i) {
            strProducts += ', ' + bill[i].name;
        }
    } else {
        strProducts = bill.name;
    }
    app.ask('Đã thêm ' + strProducts + ' vào hóa đơn. Bạn muốn mua gì thêm không?');
}

let addBillToWishlist = function (app, bill) {
    if (app.data.orderList == null) {
        app.data.orderList = [];
    }

    if (bill instanceof Array) {
        for (var i = 0; i < bill.length; ++i) {
            app.data.orderList.push(bill[i]);
        }
    } else {
        app.data.orderList.push(bill);
    }
}

let createBill = function (name, quantity, size, sugar, ice, price) {
    let bill = {
        'name': name,
        'quantily': quantity,
        'size': size,
        'sugar': sugar,
        'ice': ice,
        'price': price * quantity
    }
    return bill;
}

let findProduct = function (productname) {
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

let resetContext = function (app) {
    let contexts = app.getContexts();
    for (let i in contexts) {
        app.setContext(contexts[i].name, 0, null);
    }
}

let addOptionsContext = function (app, options) {
    const params = {};
    params['options'] = options;
    app.setContext('local-ui-options', 1, params);
}

let addConfirmContext = function (content) {

}

let addGalleryContext = function (list) {

}

let sendNewBill = function (orderList) {
    var totalPrice = 0;
    var options = [];
    for (var i = 0; i < orderList.length; ++i) {
        var product = orderList[i];
        totalPrice += parseInt(product.price);

        options.push({
            'title': product.name,
            'type': 'SL: ' + product.quantily,
            'value': product.price * product.quantily
        });
    }

    let condition = "'marika-coffee' in topics";
    // let topic = 'marika-coffee'
    let message = {
        notification: {
            title: 'Hóa đơn mới từ khách hàng take away',
            body: 'Tổng hóa đơn ' + totalPrice + ' đồng.'
        },
        data: {
            type: 'take-away'
            // ,
            // body: JSON.stringify(options)
        },
        condition: condition
        // topic: topic
    }

    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

module.exports = {
    dbChanged: dbChanged,
    welcomeHandler: welcomeHandler,
    defaultFallbackHandler: defaultFallbackHandler,
    orderHandler: orderHandler,
    findProductHandler: findProductHandler,
    askPriceHandler: askPriceHandler,
    askTotalPriceHandler: askTotalPriceHandler,
    askProductHandler: askProductHandler,
    paymentHandler: paymentHandler,
    promotionHandler: promotionHandler,
    askNextOrderHandler: askNextOrderHandler,
    multiOrderHandler,

    // varible
    drinkList: drinkList,
    foodList: foodList,
    promotionsList: promotionsList
}