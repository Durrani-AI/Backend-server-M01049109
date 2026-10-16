var express = require("express");
var cors = require("cors");
var app = express();

app.use(cors());

var lessons = [
    { id: 1001, subject: 'Computer Science', location: 'Hendon', price: '£20', availability: 5 },
    { id: 1002, subject: 'Mathematics', location: 'Colindale', price: '£15', availability: 5 },
    { id: 1003, subject: 'English', location: 'Brent Cross', price: '£18', availability: 5 }
];

app.use(function(request, response) {
    console.log("In comes a request to: " + request.url);
    response.json(lessons);
});

app.listen(3000, function() {
    console.log("App started on port 3000");
});