// For Better Auth connection error
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const app = express()
const port = process.env.PORT || 5000;

// Extras
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('SR Glow Beauty Server Running...')
})


// MongoDB Connection
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");

        // Database Collections
        const database = client.db("sr-glow-beauty");
        const productsCollection = database.collection("products")


        // All Products - /Shop
        app.get("/api/products", async (req, res) => {
            const result = await productsCollection.find().toArray();
            res.json(result);
        })




        return client;
    } catch (err) {
        console.dir(err);
    }
}

connectToMongoDB().catch(console.dir);


app.listen(port, () => {
    console.log(`SR Glow Beauty --> http://localhost:${port}`)
})