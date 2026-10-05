const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());

const FILE = "users.json";

function readUsers() {
    const data = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(data);
}

function writeUsers(users) {
    fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

app.post("/user", (req, res) => {
    const { name, age, email } = req.body;

    const users = readUsers();

    const emailExists = users.find((user) => user.email === email);
    if (emailExists) {
        return res.json({ message: "Email already exists." });
    }

    const newUser = {
        id: users.length ? users[users.length - 1].id + 1 : 1,
        name,
        age,
        email,
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ message: "User added successfully." });
});

app.patch("/user/:id", (req, res) => {
    const id = Number(req.params.id);
    const { name, age, email } = req.body;

    const users = readUsers();

    const user = users.find((u) => u.id === id);
    if (!user) {
        return res.json({ message: "User ID not found." });
    }

    if (name !== undefined) {
        user.name = name;
    }
    if (age !== undefined) {
        user.age = age;
    }
    if (email !== undefined) {
        user.email = email;
    }

    writeUsers(users);

    res.json({ message: "User updated successfully." });
});

app.delete(["/user", "/user/:id"], (req, res) => {
    const id = Number(req.params.id || req.body.id);

    const users = readUsers();

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        return res.json({ message: "User ID not found." });
    }

    users.splice(index, 1);
    writeUsers(users);

    res.json({ message: "User deleted successfully." });
});

app.get("/user/getByName", (req, res) => {
    const { name } = req.query;

    const users = readUsers();

    const user = users.find((u) => u.name.toLowerCase() === String(name).toLowerCase());
    if (!user) {
        return res.json({ message: "User name not found." });
    }

    res.json(user);
});

app.get("/user", (req, res) => {
    const users = readUsers();
    res.json(users);
});

app.get("/user/filter", (req, res) => {
    const minAge = Number(req.query.minAge);

    const users = readUsers();

    const filteredUsers = users.filter((u) => u.age >= minAge);
    if (filteredUsers.length === 0) {
        return res.json({ message: "no user found" });
    }

    res.json(filteredUsers);
});


app.get("/user/:id", (req, res) => {
    const id = Number(req.params.id);

    const users = readUsers();

    const user = users.find((u) => u.id === id);
    if (!user) {
        return res.json({ message: "User not found." });
    }

    res.json(user);
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

/*
1) What is the Node.js Event Loop?
-----------------------------------
The Event Loop is the mechanism that allows Node.js to run on a single
thread without getting blocked. Long-running operations (like reading a
file or querying a database) are handed off to run in the background.
The Event Loop keeps watching, and when an operation finishes, it takes
its callback and executes it. This way, the server can keep accepting new
requests while waiting for results.


2) What is Libuv and What Role Does It Play in Node.js?
--------------------------------------------------------
Libuv is a C library that gives Node.js its ability to handle
asynchronous operations. Its role:
- Implements the Event Loop itself.
- Handles the file system, networking, timers, and more.
- Manages the Thread Pool for heavy operations.
- Makes Node.js behave the same across different operating systems
  (Windows, Linux, macOS).


3) How Does Node.js Handle Asynchronous Operations Under the Hood?
-------------------------------------------------------------------
1. The code runs in the Call Stack.
2. When it meets an async operation (like fs.readFile or setTimeout),
   Node.js hands it over to Libuv.
3. Libuv runs it in the background: either using an operating system
   feature (like network operations) or using the Thread Pool
   (like file system operations).
4. When the operation finishes, its callback is placed in the Event Queue.
5. The Event Loop takes the callback from the queue and executes it
   when the Call Stack is empty.


4) What is the Difference Between the Call Stack, Event Queue, and Event Loop?
-------------------------------------------------------------------------------
- Call Stack: where code executes, one function after another
  (Last In, First Out). It does one thing at a time.
- Event Queue (Callback Queue): a queue where callbacks wait to be
  executed after their async operations finish.
- Event Loop: the part that watches both. If the Call Stack is empty,
  it takes the first callback from the Event Queue and pushes it into
  the Call Stack to be executed.


5) What is the Node.js Thread Pool and How to Set the Thread Pool Size?
------------------------------------------------------------------------
The Thread Pool is a group of threads managed by Libuv. Heavy operations
that can't be done asynchronously directly by the operating system run on
it, such as: file system operations, crypto (e.g. pbkdf2), zlib
(compression), and some DNS operations.

Default size: 4 threads.

It can be changed using the environment variable UV_THREADPOOL_SIZE
(maximum 1024):

    Linux / macOS:
        UV_THREADPOOL_SIZE=8 node index.js

    Windows PowerShell:
        $env:UV_THREADPOOL_SIZE=8; node index.js

Or inside the code, at the very top of the file before the Thread Pool
is used:

    process.env.UV_THREADPOOL_SIZE = 8;

(Setting it from the command line is more reliable, because setting it
from inside the code does not always work on every system.)


6) How Does Node.js Handle Blocking and Non-Blocking Code Execution?
---------------------------------------------------------------------
- Blocking: the code stops execution until the operation finishes, and
  nothing after it runs before that. Example: fs.readFileSync. It blocks
  the only thread, so no other request can be served meanwhile.
- Non-Blocking: the operation is handed off to the background and the
  code continues immediately. When the operation finishes, its callback
  runs. Example: fs.readFile.

    // Blocking
    const data = fs.readFileSync("file.txt");
    console.log(data);
    console.log("Done"); // runs only after the read finishes

    // Non-blocking
    fs.readFile("file.txt", (err, data) => {
        console.log(data);
    });
    console.log("Done"); // runs first
*/