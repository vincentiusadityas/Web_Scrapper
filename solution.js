var cheerio = require('cheerio');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

var url = 'https://m.bnizona.com/index.php/category/index/promo';

function getRequest(address, method) {
    return new Promise(function (resolve, reject) {
        request({
            method: method,
            url: address,
        }).then(function (body) {
            resolve(body);
        }).catch(function (err) {
            console.log(err);
        });
    });
}

getRequest(url, 'GET').then(function (body) {
    // call promise to process main page
    return processMainPage(body);
}).then(function (result) {
    // write output to file
    var fs = require('fs');
    fs.writeFile('solution.json', JSON.stringify(result, null, 1));
});

function processMainPage(body) {
    return new Promise(function (resolve, reject) {
        $ = cheerio.load(body.body, {
            normalizeWhitespace: true
        });

        var jsonResult = {};
        var functionList = [];
        var categories = [];

        // process each link
        $('a', 'ul.menu').each(function (index, element) {
            element = $(element);
            var href = element.attr('href');
            var category = element.text().trim().toLowerCase();
            categories.push(category);
            jsonResult[category] = [];
            functionList.push(getCategoryDetails(href));
        });

        Promise.all(functionList)
            .then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    jsonResult[categories[i]] = result[i];
                }
                resolve(jsonResult);
            })
    });
}

function getCategoryDetails(url) {
    return new Promise(function (resolve, reject) {
        getRequest(url, 'GET').then(function (body) {
            $ = cheerio.load(body.body, {
                normalizeWhitespace: true
            });
            var jsonResultCategory = [];
            var functionList = [];

            // process each link
            $('ul#lists').find('a').each(function (index, element) {
                var content = $(element);
                var temp = {};
                var target = $('ul#lists').find('a').length;
                var aLink = $(this).attr('href');
                temp = {
                    promo_title: $('span.promo-title', content).text(),
                    link: aLink,
                    img_src: $('img', content).attr('src'),
                    merchant_name: $('span.merchant-name', content).text(),
                    valid_until: $('span.valid-until', content).text()
                };
                jsonResultCategory.push(temp);
                functionList.push(getAdditionalDetails(aLink));
            });

            Promise.all(functionList)
                .then(function (result) {
                    for (var i = 0; i < result.length; i++) {
                        jsonResultCategory[i]["banner_src"] = result[i][0];
                        jsonResultCategory[i]["additional_info"] = result[i][1];
                    }
                    return jsonResultCategory;
                }).then(function (result) {
                    resolve(result);
                    // console.log(result);
                });
        });
    })
}

function getAdditionalDetails(url) {
    return new Promise(function (resolve, reject) {
        getRequest(url, 'GET').then(function (body) {
            $ = cheerio.load(body.body, {
                normalizeWhitespace: true
            });
            var details = [];

            // get img source for banner
            details.push($('img', 'div.banner').attr('src'));

            var menu = $('ul.menu').contents();
            // get other details not mentioned before
            var merchant_location = $('.content.merchant', menu);
            var additional_details = [];
            merchant_location.children().each(function () {
                if ($(this).text() != '' && $(this).text() != '-') {
                    additional_details.push($(this).text());
                }
            });
            details.push(additional_details);
            return details;
        }).then(function (details) {
            resolve(details);
        });
    });
}