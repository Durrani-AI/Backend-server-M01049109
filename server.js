var express = require("express");
var app = express();

app.use(function(request, response) {
    console.log("In comes a request to: " + request.url);
    response.end("Hello, world!");
});
app.listen(3000, function() {
    console.log("App started on port 3000");
    var express = require("express"); 
    var cors=require("cors");
    app.use(cors());
    app.use(function(request, response) {
        console.log("In comes a request to: " + request.url);
    
});