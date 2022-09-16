const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@movflix.le7dwpw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJwt(req, res, next) {
  const authHeaders = req.headers.authorization;
  console.log(authHeaders);
  if (!authHeaders) {
    return res.status(401).send({ message: "Unauthorize Access" });
  }
  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access " });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const movieCollection = client.db("CinemaHall").collection("Movies");
    const bookingCollection = client.db("CinemaHall").collection("Bookings");
    const googleUsersCollection = client.db("CinemaHall").collection("googleUsers");
    // const visitorsCollection = client.db("CinemaHall").collection("users");

    // get all movies in the collection
    app.get("/movie", async (req, res) => {
      const query = {};
      const cursor = movieCollection.find(query);
      const movie = await cursor.toArray();
      res.send(movie);
    });

    // post bookings to the booking collection
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = { movieName: booking.movieName, selected: booking.selectedDate, email: booking.email };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });

    // get all bookings
    app.get("/bookings", verifyJwt, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
      } else {
        return res.status(403).send({ message: "Forbidden Access " });
      }
    });

    // get all users
    app.get("/user", async (req, res) => {
      const users = await googleUsersCollection.find().toArray();
      res.send(users);
    });

    // save all users from google accounts
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await googleUsersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "3h" });

      res.send({ result, token });
    });

    // make admin api
    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await googleUsersCollection.updateOne(filter, updateDoc);
      res.send({ result });
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Movflix World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
