const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@movflix.le7dwpw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const movieCollection = client.db("CinemaHall").collection("Movies");
    const bookingCollection = client.db("CinemaHall").collection("Bookings");

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
       const query = {selectedDate : booking.selectedDate, movieName:booking.movieName}
       const result =await bookingCollection.insertOne(booking);
       res.send(result);
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
