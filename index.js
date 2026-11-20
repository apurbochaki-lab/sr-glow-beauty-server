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

// For cron job - server anti sleep
app.get('/health', (req, res) => {
    res.status(200).json('OK')
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

        // -------------HOME PAGE--------------

        // All Products - /Shop
        app.get("/api/products", async (req, res) => {

            try {

                // -----------Pagination & Search functionality----------

                // Pagination
                const page = Number(req.query.page) || 1
                const limit = Number(8)
                const skip = (page - 1) * limit

                // Search filters
                const search = req.query.search
                const category = req.query.category
                const sort = req.query.sort

                const query = {}

                if (search) {
                    query.$or = [
                        { productName: { $regex: search, $options: "i" } },
                        { shortDescription: { $regex: search, $options: "i" } },
                        { tags: { $regex: search, $options: "i" } }
                    ]
                }

                // Category
                if (category && category !== "All") {
                    query.category = category
                }


                // console.log(query)

                // Sorting -latest | lowToHigh | highToLow
                let sortOption = { createdAt: -1 }   // Default

                if (sort === "latest") {
                    sortOption = { updatedAt: -1 }
                }
                else if (sort === "lowToHigh") {
                    sortOption = { "pricing.salePrice": 1, "pricing.regularPrice": 1 }
                }
                else if (sort === "highToLow") {
                    sortOption = { "pricing.salePrice": -1, "pricing.regularPrice": -1 }
                }

                // Projection
                const projection = {
                    productName: 1,
                    slug: 1,
                    shortDescription: 1,
                    category: 1,
                    images: 1,
                    pricing: 1,
                    isAvailableStock: 1,
                    updatedAt: 1
                }

                // Total document count
                const totalProducts = await productsCollection.countDocuments(query)
                const totalPages = Math.ceil(totalProducts / limit)


                const result = await productsCollection
                    .find(query, { projection })
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                // Images selection filter
                const optimizedResult = result.map(product => {
                    const primaryImg = product.images?.find(img => img.isPrimary) || product.images?.[0] || null;


                    return {
                        productName: product.productName,
                        slug: product.slug,
                        shortDescription: product.shortDescription,
                        category: product.category,
                        pricing: product.pricing,
                        isAvailableStock: product.isAvailableStock,
                        updatedAt: product.updatedAt,

                        primaryImage: primaryImg ? { url: primaryImg.url, alt: primaryImg.alt } : null
                    }
                })

                // Retrieve all unique category names
                const categories = await productsCollection.distinct("category")

                // Final results
                res.json({
                    success: true,
                    categories,
                    currentPage: page,
                    totalProducts,
                    totalPages,
                    data: optimizedResult
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    success: false,
                    message: "Failed to fetch products",
                    error
                });
            }

        })

        // Product details page
        app.get("/api/product-details/:slug", async (req, res) => {
            try {
                const { slug } = req.params
                const result = await productsCollection.findOne({ slug })
                res.json(result)
                // console.log(result)

            } catch (error) {
                console.error(error);
                res.status(500).send({
                    success: false,
                    message: "Failed to fetch product data",
                    error
                });
            }
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








