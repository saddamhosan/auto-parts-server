const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()
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
        //get all parts
        app.get('/parts',async(req,res)=>{
            const result= await partsCollection.find().toArray()
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