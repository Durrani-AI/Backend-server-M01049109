// ============================================================
// server.js - the backend (server side) of the lessons web app
// This file creates a small web server using Express.
// The front end (the website) talks to this server to:
//   1. get the list of lessons   (GET /lessons)
//   2. send a new order          (POST /orders)
//   3. update a lesson           (PUT /lessons/:_id)
//   4. load lesson pictures      (/images/...)
// The lessons and orders are stored in a MongoDB Atlas database.
// ============================================================

// --------------------- 1. LOAD THE TOOLS WE NEED ---------------------

// Load the "dotenv" library and tell it to read our secret values from config.env.
// After this line, every value in config.env is available as process.env.NAME.
require("dotenv").config({ path: "./config.env" });
// Load the Express library. Express makes it easy to build a web server in Node.js.
var express = require("express");
// Load the CORS library. CORS lets a website on a DIFFERENT address (e.g. GitHub Pages)
// talk to this server. Without it, the browser would block those requests for safety.
var cors = require("cors");
// Load Node's built-in "path" tool. It helps us build file/folder paths safely
// (it handles "/" vs "\" differences between Mac/Linux and Windows for us).
var path = require("path");
// Load two tools from the "mongodb" library:
//   MongoClient = the object that talks to the database.
//   ObjectId    = turns a text id (e.g. "65a1...") into MongoDB's special _id type.
const { MongoClient, ObjectId } = require("mongodb");
// Create our actual server app. "app" is the object we use to set up everything below.
var app = express();

// --------------------- 2. CONNECT TO THE DATABASE ---------------------

// Build the full connection string by joining the parts from config.env together.
// Result looks like: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/
const uri = process.env.MONGODB_PREFIX + process.env.MONGODB_USERNAME + ":" + process.env.MONGODB_PASSWORD + process.env.MONGODB_URL;
// Create a client (a "connection object") using that address.
// It connects automatically the first time we ask the database for something.
const client = new MongoClient(uri);
// Choose which database (inside our cluster) we want to use.
// CHANGE "DatabaseName" to the exact name of your database in Atlas.
const db = client.db("SchoolActivities");

// --------------------- 3. MIDDLEWARE (runs on every request) ---------------------
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

// --------------------- 4. ROUTES (the server's "menu") ---------------------
// A "route" = an address + request type that the server knows how to answer.
// The route functions are "async" so we can use "await" to wait for the database to reply.

// GET /lessons
// When the front end asks for "/lessons" using GET (i.e. "give me data"), this function runs.
app.get("/lessons", async function(request, response) {
    // Pick the "lessons" collection (like a table) from the database.
    let collection = await db.collection("lessons");
    // find({}) = find ALL documents (the empty {} means "no filter").
    // toArray() turns the results into a normal JavaScript array.
    let results = await collection.find({}).toArray();
    // Send the lessons back to the front end. MongoDB data is already JSON-friendly.
    response.send(results);
}); // End of the GET /lessons route.

// POST /orders
// When the front end SENDS an order to "/orders" using POST (i.e. "here is some data"), this runs.
app.post("/orders", async function(request, response) {
    // request.body holds the order the front end sent (name, phone, and the lesson IDs in the cart).
    var body = request.body;
    // Print the order details in the terminal so we can see what arrived.
    console.log("New order received:", body);
    // Pick the "orders" collection from the database.
    let collection = await db.collection("orders");
    // Save the order as one new document in the collection.
    let result = await collection.insertOne(body);
    // Reply to the front end with the result (it includes the new order's _id).
    response.send(result);
}); // End of the POST /orders route.

// PUT /lessons/:_id
// Used to UPDATE an existing lesson (e.g. lower its spaces after an order).
// ":_id" is a placeholder - e.g. a request to /lessons/65a1b2c3... puts "65a1b2c3..." in request.params._id
app.put("/lessons/:_id", async function(request, response) {
    // request.body holds the fields to change, e.g. { "availability": 4 }
    var body = request.body;
    // Pick the "lessons" collection from the database.
    let collection = await db.collection("lessons");
    // Grab the id from the address (the part after /lessons/).
    let tempid = request.params._id;

    // The "query" says WHICH lesson to update: the one whose _id matches.
    // new ObjectId(...) converts the text id into MongoDB's _id type so they can match.
    const query = { _id: new ObjectId(tempid) };
    // The "updates" say WHAT to change. $set only changes the fields we send, the rest stay the same.
    const updates = {
        $set: body
    };
    // Apply the update to the one matching lesson and wait for the database to finish.
    let result = await collection.updateOne(query, updates);
    // Send the result back (it says how many lessons were matched and changed).
    response.send(result);
    // Also print the result in the terminal.
    console.log(result);
}); // End of the PUT /lessons route.

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
