const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config()
var jwt = require("jsonwebtoken");
const app=express()
const port=process.env.PORT ||4000


//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2kmk8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
      await client.connect();
      const partsCollection = client.db("automobile").collection("parts");
      const userCollection = client.db("automobile").collection("user");
      const orderCollection = client.db("automobile").collection("order");

      //when user sign in and login then get a token
      app.put("/user/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const query = { email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await userCollection.updateOne(
          query,
          updateDoc,
          options
        );
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        res.send({ result, token });
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
      app.post('/order', async(req,res)=>{
        const order=req.body
        const result = await orderCollection.insertOne(order)
        res.send(result)
      })

      //get order filtering by email
      app.get('/order/:email',async(req,res)=>{
        const email=req.params.email
        const query={email}
        const result=await orderCollection.find(query).toArray()
        res.send(result)
      })

      //delete order
      app.delete('/order/:id',async(req,res)=>{
        const id=req.params.id
        console.log(id);
        const query={_id:ObjectId(id)}
        const result=await orderCollection.deleteOne(query)
        res.send(result)
      })
    } finally {
    // await client.close();
  }
}
run().catch(console.dir);


//https://pacific-hamlet-76531.herokuapp.com/
app.get('/',(req,res)=>{
    res.send("welcome to automobile manufacturing server");

})

app.listen(port,()=>{
    console.log('listening to tort',port);
})