var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

// app.get('/scrape', function(req, res){

//   //All the web scraping magic will happen here

// })

// app.listen('8081')

url = 'https://m.bnizona.com/index.php/category/index/promo';

request(url, function(error, response, html){
  if (!error && response.statusCode == 200) {

    var title, link, imageUrl, promo, valid;
    var category = {};
    var promotion = { title : "", link : "", imageUrl : "", 
                     promo : "", valid : ""};
    
    var $ = cheerio.load(html);
    
    $('ul.menu li').each(function(index){ 
      var data = $(this);
      var categoryName = data.text().trim();
      var subUrl = data.children().next().attr('href');
      console.log("CATEGORY : " + categoryName + ", " + subUrl);

      request(subUrl, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          
          $('ul.list2 li').forEach(function(index) {
            var data = $(this);
            var link = data.children().attr('href');
            var title = data.children().children().next().text();
            console.log(link);
            console.log(title);
          })  
        }
      });
      console.log("\n")
    })
  }
});

console.log('Magic happens on port 8081');

exports = module.exports = app;