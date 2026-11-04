// ============================================================
// server.js - the backend (server side) of the lessons web app
// This file creates a small web server using Express.
// The front end (the website) talks to this server to:
//   1. get the list of lessons   (GET /lessons)
//   2. send a new order          (POST /orders)
//   3. load lesson pictures      (/images/...)
// ============================================================

// --------------------- 1. LOAD THE TOOLS WE NEED ---------------------

// Load the Express library. Express makes it easy to build a web server in Node.js.
var express = require("express");
// Load the CORS library. CORS lets a website on a DIFFERENT address (e.g. GitHub Pages)
// talk to this server. Without it, the browser would block those requests for safety.
var cors = require("cors");
// Load Node's built-in "path" tool. It helps us build file/folder paths safely
// (it handles "/" vs "\" differences between Mac/Linux and Windows for us).
var path = require("path");
// Create our actual server app. "app" is the object we use to set up everything below.
var app = express();

// --------------------- 2. MIDDLEWARE (runs on every request) ---------------------
// "Middleware" = a function that runs BEFORE the request reaches its final route.
// Think of it like checkpoints the request passes through, one after another, in order.

// Turn on CORS for every request, so the front end is allowed to call this server.
app.use(cors());
// Tell Express to read JSON data sent in a request body (e.g. an order from the front end)
// and turn it into a normal JavaScript object we can use as "request.body".
app.use(express.json());

// Logger middleware
// This runs for EVERY request and prints it in the terminal, so we can see what is happening.
app.use(function(request, response, next) {
    // Print the type of request (GET, POST, etc.) and the address that was asked for.
    // Example output: "GET request to: /lessons"
    console.log(request.method + " request to: " + request.url);
    // "next()" means "I'm done, pass the request on to the next middleware/route".
    // If we forgot this, the request would get stuck here and never get a reply.
    next();
});

// Static file middleware for lesson images
// If a request starts with "/images", look for the file inside the "images" folder and send it back.
// __dirname = the folder this server.js file is in. path.join sticks it together with "images".
// Example: a request to /images/maths.png sends back the file images/maths.png
app.use("/images", express.static(path.join(__dirname, "images")));
// If the image was NOT found in the folder above, the request falls through to here.
app.use("/images", function(request, response) {
    // Reply with status 404 (meaning "not found") and a simple error message.
    response.status(404).send("Image not found");
});

// --------------------- 3. THE DATA ---------------------

// A list (array) of lessons. Each lesson is an object with some details.
// For now the data is stored here in memory (it resets when the server restarts).
var lessons = [
    // Each line is one lesson: a unique id, the subject name, where it is, the cost,
    // and how many spaces (availability) are left.
    { id: 1001, subject: 'Computer', location: 'Hendon', price: '£20', availability: 5 },
    { id: 1002, subject: 'Mathematics', location: 'Colindale', price: '£15', availability: 5 },
    { id: 1003, subject: 'English', location: 'Brent Cross', price: '£18', availability: 5 }
]; // End of the lessons list.

// --------------------- 4. ROUTES (the server's "menu") ---------------------
// A "route" = an address + request type that the server knows how to answer.

// GET /lessons
// When the front end asks for "/lessons" using GET (i.e. "give me data"), this function runs.
app.get("/lessons", function(request, response) {
    // Send the whole lessons list back to the front end in JSON format.
    response.json(lessons);
}); // End of the GET /lessons route.

// POST /orders
// When the front end SENDS an order to "/orders" using POST (i.e. "here is some data"), this runs.
app.post("/orders", function(request, response) {
    // Print the order details in the terminal. request.body holds the data the front end sent
    // (this works because of express.json() above).
    console.log("New order received:", request.body);
    // Reply to the front end with a small JSON message to confirm we got the order.
    response.json({ message: "Order received" });
}); // End of the POST /orders route.

// --------------------- 5. CATCH-ALL ERROR ---------------------

// 404 for unrecognised requests
// This is placed LAST on purpose. If a request didn't match ANY route above,
// it ends up here, meaning the address doesn't exist on our server.
app.use(function(request, response) {
    // Reply with status 404 ("not found") and a message.
    response.status(404).send("Resource not found");
}); // End of the 404 handler.

// --------------------- 6. START THE SERVER ---------------------

// Start the server and make it listen for requests on port 3000.
// (A port is like a door number on the computer. Visit http://localhost:3000 to reach it.)
app.listen(3000, function() {
    // This runs once the server has started successfully, to let us know it's working.
    console.log("App started on port 3000");
}); // End of app.listen - the server now keeps running and waiting for requests.
