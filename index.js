var shortUrl = require('node-url-shortener');
 
shortUrl.short('rfhaiyan.ph', function(err, url){
    console.log(url);
});