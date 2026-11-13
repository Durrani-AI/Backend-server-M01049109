// ============================================================
// server.js - the backend (server side) of the lessons web app
// This file creates a small web server using Express.
// The front end (the website) talks to this server to:
//   1. get the list of lessons       (GET /lessons)
//   2. search for lessons            (GET /search?q=...)
//   3. send a new order              (POST /orders)
//   4. update a lesson               (PUT /lessons/:_id)
//   5. get enrolment for a lesson    (GET /enrolment/:lessonid)
//   6. load lesson pictures          (/images/...)
// The lessons and orders are stored in a MongoDB Atlas database.
// The server can run on your own computer (localhost) OR online on Render.
// ============================================================

// --------------------- 1. LOAD THE TOOLS WE NEED ---------------------
// We use "const" for every variable in this file. "const" means the variable
// always points to the same thing once it is created (it is never reassigned).

// Load the "dotenv" library and tell it to read our secret values from config.env.
// After this line, every value in config.env is available as process.env.NAME.
// On Render there is NO config.env file (it is not on GitHub). Instead, Render gives
// the same values to process.env from its "Environment Variables" settings page.
require("dotenv").config({ path: "./config.env" });
// Load the Express library. Express makes it easy to build a web server in Node.js.
const express = require("express");
// Load the CORS library. CORS lets a website on a DIFFERENT address (e.g. GitHub Pages)
// talk to this server. Without it, the browser would block those requests for safety.
const cors = require("cors");
// Load Node's built-in "path" tool. It helps us build file/folder paths safely
// (it handles "/" vs "\" differences between Mac/Linux and Windows for us).
const path = require("path");
// Load two tools from the "mongodb" library:
//   MongoClient = the object that talks to the database.
//   ObjectId    = turns a text id (e.g. "65a1...") into MongoDB's special _id type.
const { MongoClient, ObjectId } = require("mongodb");
// Create our actual server app. "app" is the object we use to set up everything below.
const app = express();

// The port (door number) the server listens on.
// Render picks its own port and passes it in process.env.PORT.
// On our own computer there is no PORT value, so we fall back to 3000.
// ("||" means "use the left value, but if it's empty use the right one".)
const PORT = process.env.PORT || 3000;

// --------------------- 2. CONNECT TO THE DATABASE ---------------------

// Build the full connection string by joining the parts from config.env together.
// Result looks like: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/
const uri = process.env.MONGODB_PREFIX + process.env.MONGODB_USERNAME + ":" + process.env.MONGODB_PASSWORD + process.env.MONGODB_URL;
// Create a client (a "connection object") using that address. It does not connect yet.
const client = new MongoClient(uri);
// Choose which database (inside our cluster) we want to use.
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
// On Render, these messages appear in the "Logs" tab of your service.
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
// Example: a request to /images/English.png sends back the file images/English.png
app.use("/images", express.static(path.join(__dirname, "images")));
// If the image was NOT found in the folder above, the request falls through to here.
app.use("/images", function(request, response) {
    // Reply with status 404 (meaning "not found") and a simple error message.
    response.status(404).send("Image not found");
});

// --------------------- 4. ROUTES (the server's "menu") ---------------------
// A "route" = an address + request type that the server knows how to answer.
// The route functions are "async" so we can use "await" to wait for the database to reply.
// Each route uses "try / catch": if the database fails, we send back an error (status 500)
// instead of leaving the front end waiting forever with no answer.

// GET /
// The home address. Visiting the server's main link shows this message,
// so we (and Render) can quickly check the server is up and running.
app.get("/", function(request, response) {
    // Send a short text message back.
    response.send("Backend server is running. Try /lessons to see the lessons.");
}); // End of the GET / route.

// GET /lessons
// When the front end asks for "/lessons" using GET (i.e. "give me data"), this function runs.
app.get("/lessons", async function(request, response) {
    // Try to get the lessons from the database.
    try {
        // Pick the "lessons" collection (like a table) from the database.
        const collection = db.collection("lessons");
        // find({}) = find ALL documents (the empty {} means "no filter").
        // toArray() turns the results into a normal JavaScript array.
        const results = await collection.find({}).toArray();
        // Send the lessons back to the front end. MongoDB data is already JSON-friendly.
        response.send(results);
    } catch (err) {
        // Something went wrong with the database. Print the error for us to see.
        console.error("Error getting lessons:", err);
        // Tell the front end it failed. 500 = "something went wrong on the server".
        response.status(500).send({ error: "Could not get lessons" });
    }
}); // End of the GET /lessons route.

// GET /search
// Searches lessons in MongoDB as the user types in the search box (e.g. /search?q=math).
// Matches if the search text appears in the subject, location, price, or availability.
app.get("/search", async function(request, response) {
    // Get the search word from the URL query (?q=...). If nothing was sent, use an empty string.
    // trim() removes any spaces at the start and end.
    const queryText = String(request.query.q || "").trim();
    // Try to search the lessons collection in MongoDB.
    try {
        // Pick the "lessons" collection from the database.
        const collection = db.collection("lessons");
        // If the search box is empty, return all lessons.
        if (queryText === "") {
            const allLessons = await collection.find({}).toArray();
            return response.send(allLessons);
        }
        // Some characters (like + ( ) . *) have a special meaning in a search pattern.
        // This line puts a "\" in front of them, so they are treated as normal text.
        // Without it, typing "(" would cause an error and "." would match every letter.
        const safeText = queryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Build a search pattern from the text. "i" = ignore capital/small letters ("MATH" = "math").
        const regex = new RegExp(safeText, "i");
        // Build the list of fields to match: subject, location, or price.
        const orConditions = [
            { subject: regex },
            { location: regex },
            { price: regex }
        ];
        // If the user typed a number (e.g. "5"), also match lessons with that exact availability.
        if (!isNaN(Number(queryText))) {
            orConditions.push({ availability: Number(queryText) });
        }
        // Find all lessons that match ANY ($or) of the conditions above.
        const results = await collection.find({ $or: orConditions }).toArray();
        // Send the matching lessons back to the front end.
        response.send(results);
    } catch (err) {
        // Something went wrong with the search. Print the error and send back status 500.
        console.error("Error searching lessons:", err);
        response.status(500).send({ error: "Could not search lessons" });
    }
}); // End of the GET /search route.

// POST /orders
// When the front end SENDS an order to "/orders" using POST (i.e. "here is some data"), this runs.
app.post("/orders", async function(request, response) {
    // request.body holds the order the front end sent (name, phone, and the lesson IDs in the cart).
    const body = request.body;
    // Simple safety check: if the order is empty (nothing was sent), don't save it.
    // Object.keys(body).length counts how many fields the order has.
    if (!body || Object.keys(body).length === 0) {
        // 400 = "bad request" - the front end sent something wrong. "return" stops the function here.
        return response.status(400).send({ error: "Order is empty" });
    }
    // If the order has a list of lessonIDs, also record "spaces" (how many total spaces were ordered).
    // This makes sure every order in MongoDB has all 4 required fields: name, phone, lessonIDs, and spaces.
    if (Array.isArray(body.lessonIDs) && body.spaces === undefined) {
        body.spaces = body.lessonIDs.length;
    }
    // Try to save the order in the database.
    try {
        // Print the order details in the terminal so we can see what arrived.
        console.log("New order received:", body);
        // Pick the "orders" collection from the database.
        const collection = db.collection("orders");
        // Save the order as one new document in the collection.
        const result = await collection.insertOne(body);
        // Reply to the front end with the result (it includes the new order's _id).
        response.send(result);
    } catch (err) {
        // Saving failed. Print the error and tell the front end.
        console.error("Error saving order:", err);
        response.status(500).send({ error: "Could not save order" });
    }
}); // End of the POST /orders route.

// PUT /lessons/:_id
// Used to UPDATE an existing lesson (e.g. lower its spaces after an order).
// ":_id" is a placeholder - e.g. a request to /lessons/65a1b2c3... puts "65a1b2c3..." in request.params._id
app.put("/lessons/:_id", async function(request, response) {
    // request.body holds the fields to change, e.g. { "availability": 4 }
    const body = request.body;
    // Grab the id from the address (the part after /lessons/).
    const tempid = request.params._id;

    // Check the id is in the correct MongoDB format (24 letters/numbers).
    // If not, new ObjectId() below would crash, so we reply with an error instead.
    if (!ObjectId.isValid(tempid)) {
        // 400 = "bad request". "return" stops the function here.
        return response.status(400).send({ error: "Invalid lesson id" });
    }

    // Try to update the lesson in the database.
    try {
        // Pick the "lessons" collection from the database.
        const collection = db.collection("lessons");
        // The "query" says WHICH lesson to update: the one whose _id matches.
        // new ObjectId(...) converts the text id into MongoDB's _id type so they can match.
        const query = { _id: new ObjectId(tempid) };
        // The "updates" say WHAT to change. $set only changes the fields we send, the rest stay the same.
        const updates = {
            $set: body
        };
        // Apply the update to the one matching lesson and wait for the database to finish.
        const result = await collection.updateOne(query, updates);
        // Send the result back (it says how many lessons were matched and changed).
        response.send(result);
        // Also print the result in the terminal.
        console.log(result);
    } catch (err) {
        // Updating failed. Print the error and tell the front end.
        console.error("Error updating lesson:", err);
        response.status(500).send({ error: "Could not update lesson" });
    }
}); // End of the PUT /lessons route.

// GET /enrolment/:lessonid
// Challenge task route: takes a lesson id and returns how many spaces of that lesson
// have already been purchased across all orders in the "orders" collection.
app.get("/enrolment/:lessonid", async function(request, response) {
    // Grab the lesson id from the URL (the part after /enrolment/).
    const lessonId = request.params.lessonid;
    // Try to count how many times this lesson was ordered in the database.
    try {
        // Pick the "orders" collection from the database.
        const collection = db.collection("orders");
        // Find all orders that contain this lessonId inside their "lessonIDs" array.
        const matchingOrders = await collection.find({ lessonIDs: lessonId }).toArray();
        // Start a counter at 0 to count every purchased slot for this lesson.
        let enrolmentCount = 0;
        // Loop through each matching order.
        for (const order of matchingOrders) {
            // Loop through each id inside that order's lessonIDs list.
            for (const id of order.lessonIDs) {
                // Every time the id matches our lessonId, add 1 to the counter.
                if (id === lessonId) {
                    enrolmentCount = enrolmentCount + 1;
                }
            }
        }
        // Send the total enrolment number back as JSON.
        response.send({ lessonId: lessonId, enrolment: enrolmentCount });
    } catch (err) {
        // If anything goes wrong with the database, log the error and reply with status 500.
        console.error("Error getting enrolment:", err);
        response.status(500).send({ error: "Could not get enrolment" });
    }
}); // End of the GET /enrolment/:lessonid route.

// --------------------- 5. CATCH-ALL ERROR ---------------------

// 404 for unrecognised requests
// This is placed LAST on purpose. If a request didn't match ANY route above,
// it ends up here, meaning the address doesn't exist on our server.
app.use(function(request, response) {
    // Reply with status 404 ("not found") and a message.
    response.status(404).send("Resource not found");
}); // End of the 404 handler.

// --------------------- 6. START THE SERVER ---------------------

// An async function that connects to the database FIRST, then starts the server.
// Doing it in this order means we find out straight away if the database details are wrong.
async function startServer() {
    // Try to connect to MongoDB.
    try {
        // Connect to the database and wait until it is done.
        await client.connect();
        // Let us know the connection worked.
        console.log("Connected to MongoDB");
    } catch (err) {
        // The connection failed (e.g. wrong password, or Atlas is blocking Render's address).
        // Print why, so we can fix it. The server still starts below. Each database route
        // will try to connect again, and reply with an error (status 500) if it still fails.
        console.error("Could not connect to MongoDB:", err.message);
    }
    // Start the server and make it listen for requests on PORT (3000 locally, Render's port online).
    // (A port is like a door number on the computer. Locally, visit http://localhost:3000 to reach it.)
    app.listen(PORT, function() {
        // This runs once the server has started successfully, to let us know it's working.
        console.log("App started on port " + PORT);
    }); // End of app.listen - the server now keeps running and waiting for requests.
} // End of startServer.

// Run the function above to connect to the database and start the server.
startServer();
