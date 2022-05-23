const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const res = require("express/lib/response");
const app = express();
const port = process.env.PORT || 4000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2kmk8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db("automobile").collection("parts");
    const userCollection = client.db("automobile").collection("user");
    const orderCollection = client.db("automobile").collection("order");
    const reviewCollection = client.db("automobile").collection("review");
    const paymentCollection = client.db("automobile").collection("payments");

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: decodedEmail,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    };

    //when user sign in and login then get a token
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ result, token });
    });

    //added admin role
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //check admin
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    //get all users
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //delete user
    app.delete("/user/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //get all parts
    app.get("/parts", async (req, res) => {
      const result = await partsCollection.find().toArray();
      res.send(result);
    });
    //get one part find by id
    app.get("/part/:id", async (req, res) => {
      const id = req.params;
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.findOne(query);
      res.send(result);
    });

    // insert a order
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    //get order filtering by email
    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    //delete order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    //get a single booking for payment
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });
    //update order and insert payment after payment
    app.put('/orders/:id',async(req,res)=>{
      const id=req.params.id
      const payment=req.body
      const query={_id:ObjectId(id)}
      const updatedDoc={
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }

      const result=await paymentCollection.insertOne(payment)
      const updateOrder=await orderCollection.updateOne(query,updatedDoc) 
      res.send(updatedDoc)
    })

    //payment
    app.post("/create-payment-intent", async (req, res) => {
      const service = req.body;
      const price = service.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    //insert a review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    //get all review
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//https://pacific-hamlet-76531.herokuapp.com/
app.get("/", (req, res) => {
  res.send("welcome to automobile manufacturing server");
});

app.listen(port, () => {
  console.log("listening to tort", port);
});
