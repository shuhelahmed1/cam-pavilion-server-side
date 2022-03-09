const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oesrn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    await client.connect();
    const database = client.db("cam-pavilion");
    const productsCollection = database.collection("products");
    const reviewCollection = database.collection("review");
    const ordersCollection = database.collection("orders");

    // post api for products
    app.post('/products', async(req,res)=>{
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result)
    })

    // get api for products
    app.get('/products', async(req,res)=>{
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products)
    })

    // get api particular product id
    app.get('/products/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await productsCollection.findOne(query)
      console.log('load user with id',id);
      res.send(result)
    })

    // post api for review
    app.post('/review', async(req,res)=>{
      const newReview= req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result)
    })

     // get api for review
     app.get('/review', async(req,res)=>{
      const cursor = reviewCollection.find({});
      const result = await cursor.toArray();
      res.send(result)
    })

    // post api for orders
    app.post('/orders', async(req,res)=>{
      const newOrder= req.body;
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result)
      console.log('order placed')
    })

    // get api for orders
    app.get('/orders', async(req,res)=>{
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.send(result)
    })
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('running my server')
})

app.listen(port, ()=>{
    console.log('running server on port', port)
})

