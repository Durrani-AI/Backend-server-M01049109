var express = require("express");
var cors = require("cors");
var path = require("path");
var app = express();

app.use(cors());
app.use(express.json());

// Logger middleware
app.use(function(request, response, next) {
    console.log(request.method + " request to: " + request.url);
    next();
});

// Static file middleware for lesson images
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/images", function(request, response) {
    response.status(404).send("Image not found");
});

var lessons = [
    { id: 1001, subject: 'Computer', location: 'Hendon', price: '£20', availability: 5 },
    { id: 1002, subject: 'Mathematics', location: 'Colindale', price: '£15', availability: 5 },
    { id: 1003, subject: 'English', location: 'Brent Cross', price: '£18', availability: 5 }
];

// GET /lessons
app.get("/lessons", function(request, response) {
    response.json(lessons);
});

// POST /orders
app.post("/orders", function(request, response) {
    console.log("New order received:", request.body);
    response.json({ message: "Order received" });
});

// 404 for unrecognised requests
app.use(function(request, response) {
    response.status(404).send("Resource not found");
});

app.listen(3000, function() {
    console.log("App started on port 3000");
});