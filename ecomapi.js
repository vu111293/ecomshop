// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;
let sprintf = require('sprintf-js').sprintf;

const HOST_ECOM = 'https://innoway-server.mcommerce.com.vn/api/v1';
const AUTHENTICATION_ECOM_SERVER = 'Basic a3l0aHVhdEBraW1zb250aWVuLmNvbTpDaG90cm9ubmllbXZ1aTE=';

// mockup request
var mocOrderRequest = {
    "address": "17A Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam",
    "longitude": 106.700632,
    "latitude": 10.785387,
    "sub_fee": 0,
    "channel": "at_store",
    "is_vat": false,
    "pay_amount": 0,
    "receive_amount": 0,
    "branch_id": "e1d8bb70-f45e-11e7-b8a6-d51f40ca4e2d",
    "employee_id": "e24ba180-f45e-11e7-b8a6-d51f40ca4e2d",
    "customer_id": "82d82590-f4de-11e7-b8a6-d51f40ca4e2d",
    "products": [
        {
            "product_id": "5c56f0b0-f4e1-11e7-b8a6-d51f40ca4e2d",
            "amount": 1,
            "topping_value_ids": [
            ]
        },
        {
            "product_id": "de47f980-f4e0-11e7-b8a6-d51f40ca4e2d",
            "amount": 1,
            "topping_value_ids": [
            ]
        }
    ]
}


function ecomModule() {

    this.makeOrder = function(callback) {
        order(callback);
    }

    // private functions

    // Call ecom api
    var order = function (callback) {
        var options = {
            headers: {
                'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXlsb2FkIjp7ImJyYW5kX2lkIjoiZTFiZjY3MTAtZjQ1ZS0xMWU3LWI4YTYtZDUxZjQwY2E0ZTJkIiwiZW1wbG95ZWVfaWQiOiJlMjRiYTE4MC1mNDVlLTExZTctYjhhNi1kNTFmNDBjYTRlMmQiLCJmaXJlYmFzZV90b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpqYkdGcGJYTWlPbnNpWW5KaGJtUmZhV1FpT2lKbE1XSm1OamN4TUMxbU5EVmxMVEV4WlRjdFlqaGhOaTFrTlRGbU5EQmpZVFJsTW1RaUxDSndaWEp0YVhOemFXOXVJam9pWVdSdGFXNGlmU3dpZFdsa0lqb2laVEkwWW1FeE9EQXRaalExWlMweE1XVTNMV0k0WVRZdFpEVXhaalF3WTJFMFpUSmtJaXdpYVdGMElqb3hOVEU1TnpFM01qZzRMQ0psZUhBaU9qRTFNVGszTWpBNE9EZ3NJbUYxWkNJNkltaDBkSEJ6T2k4dmFXUmxiblJwZEhsMGIyOXNhMmwwTG1kdmIyZHNaV0Z3YVhNdVkyOXRMMmR2YjJkc1pTNXBaR1Z1ZEdsMGVTNXBaR1Z1ZEdsMGVYUnZiMnhyYVhRdWRqRXVTV1JsYm5ScGRIbFViMjlzYTJsMElpd2lhWE56SWpvaVptbHlaV0poYzJVdFlXUnRhVzV6WkdzdGFURXhOR3hBWkdGemFHSnZZWEprTFhabGNuTnBiMjR0TWkwd0xtbGhiUzVuYzJWeWRtbGpaV0ZqWTI5MWJuUXVZMjl0SWl3aWMzVmlJam9pWm1seVpXSmhjMlV0WVdSdGFXNXpaR3N0YVRFeE5HeEFaR0Z6YUdKdllYSmtMWFpsY25OcGIyNHRNaTB3TG1saGJTNW5jMlZ5ZG1salpXRmpZMjkxYm5RdVkyOXRJbjAuUEk5d2Q1LTlEb192Tml4YlJXYnI3Y3l6N2hwd0U2RUtsZGdUTUhpRWhvMzN4ZExlNHJDNENrdTFVQVNuYmpNb0NHZGl1UThHV29jNHd4TlVFNWp0SFp2QThsaXVlN21lc04xR29zeVBpczc4QmN4T3lfbU0yNU1pWFFmMk9pSlFCd3FfNDNfSDg1Skk5QVdzVWFrdVJYVzVKRGdzUFY3bGRvbkQzODJwUGRVdmN5Zi1kcWZoN2ZCZ2VoZ0FNU0QtbnFGcWhmMVdaNUN4eGhxeGZJeHotTFV4dWFPLWQwVkpjazBMSS1NQktjdnd4OHhtNHdSa1p4SUQ4cDZ6Q1BrVWNOMHc3YUpYTFVnSkEzS0R1ZzVvVXpLRlBtYVpyeHRjMWxadjZxOG5MeU5yZHdRUUEtdGpTNHFiZmxtUmZWYU5MeGZiei1VZU9QZzJvRmpLM0QyckZnIn0sInJvbGVzIjpbImFkbWluIl0sImV4cCI6IjIwMTgtMDItMjhUMDc6NDE6MjguODI1WiJ9.hOxHoIimqMmT6Nh5b5im_Tm48IFCOeiWVbvqZ2zkk-I',
                'Content-Type': 'application/json'
            },

            body: mocOrderRequest,
            json: true
        }

        rxhttp.post(HOST_ECOM + '/bill/order_at_store', options)
            .subscribe(
                (data) => {
                    let code = data.response.statusCode;
                    if (code == 200) {
                        callback(data.response.toJSON().body.results.object.bill);
                    } else {
                        callback(null);
                    }
                },
                (err) => {
                    callback(null);
                }
            );

    }

}

module.exports = ecomModule;