# CST3144 Full-Stack Coursework — After-School Classes & Activities (M01049109)

## Coursework Links

- **[Vue.js App] GitHub Repository:** 
https://github.com/Durrani-AI/SchoolApp.git
https://github.com/Durrani-AI/SchoolApp
- **[Vue.js App] GitHub Pages (Live Front-End):** 
https://durrani-ai.github.io/SchoolApp/
- **[Express.js App] GitHub Repository:** https://github.com/Durrani-AI/Backend-server-M01049109
- **[Express.js App] Render.com Route (Returns All Lessons):** https://backend-server-m01049109.onrender.com/lessons

## REST API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/lessons` | Returns all lessons from MongoDB (`SchoolActivities.lessons`) as JSON |
| `GET` | `/search?q=<query>` | Searches lessons across `subject`, `location`, `price`, and `availability` |
| `POST` | `/orders` | Saves a new order (`name`, `phone`, `lessonIDs`, `spaces`) to `SchoolActivities.orders` |
| `PUT` | `/lessons/:_id` | Updates any attribute(s) of a lesson in `SchoolActivities.lessons` by `_id` |
| `GET` | `/enrolment/:lessonid` | Returns the total number of slots purchased for a given lesson `_id` |
| `GET` | `/images/:filename` | Serves lesson images from `/images` or returns `404 Image not found` |
