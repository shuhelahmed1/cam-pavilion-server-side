const express = require('express');
const cors = require('cors');
var admin = require("firebase-admin");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// firebase admin initiazition


var serviceAccount = require('./cam-pavilion-firebase-adminsdk-efruf-a6a137de66.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oesrn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try{
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      req.decodedUserEmail = decodedUser.email;
    }
    catch{

    }
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("cam-pavilion");
    const productsCollection = database.collection("products");
    const reviewCollection = database.collection("review");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");
     
                    //  PRODUCT API'S

    // post api for products
    app.post('/products', async(req,res)=>{
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result)
    })

    // get api for products
    app.get('/products', async(req,res)=>{
      const cursor = productsCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let products;
      const count = await cursor.count();
      if(page){
        products = await cursor.skip(page*size).limit(size).toArray()
      }
      else{
        products = await cursor.toArray();
      }
      res.send({
        count,
        products})
    })

    // get api particular product id
    app.get('/products/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await productsCollection.findOne(query)
      console.log('load user with id',id);
      res.send(result)
    })

                                  // REVIEW API'S

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

                               // ORDER API'S

    // post api for orders
    app.post('/orders', verifyToken, async(req,res)=>{
      const newOrder= req.body;
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result)
      console.log('order placed')
    })

    // get api for orders
    app.get('/orders', async(req,res)=>{
      const email = req.query.email;
      if(req.decodedUserEmail === email){
        const  query = {email: email}
        const cursor = ordersCollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
      }else{
        res.status(401).json({message: 'user  not authorized'})
      }
    })

    // delete api for orders
    app.delete('/orders/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await ordersCollection.deleteOne(query)
      console.log(result)
      res.json(result)
    })

                              // USERS API'S

    // post api for users
    app.post('/users', async(req,res)=>{
      const user = req.body;
      const result = await usersCollection.insertOne(user)
      res.json(result)
    })

    // put api for users
    app.put('/users', async(req,res)=>{
      const user = req.body;
      const filter = {email: user.email};
      const options = {upsert: true};
      const updateDoc = {$set: user};
      const result = await usersCollection.updateOne(filter,updateDoc,options);
      res.json(result);
    })

    // put api for users admin
    app.put('/users/admin', async(req,res)=>{
      const user = req.body;
      const filter = {email: user.email}
      const updateDoc = {$set: {role: 'admin'}}
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result)
    })

    // get api for specific user
    app.get('/users/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if(user?.role === 'admin'){
        isAdmin=true;
      }
      res.json({admin: isAdmin})
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
