const express = require('express')
const { MongoClient } = require('mongodb');
const app = express()
const cors = require('cors')

require('dotenv').config()

const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vithd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect()

        const database = client.db("order-management")
        const productsCollection = database.collection("products");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection("users");
        //all products
        app.get('/products', async (req, res) => {
            const size = req.query;
            const cursor = productsCollection.find({})
            //   if (size) {
            //     cursor = productsCollection.find({}).limit(6)
            //   }
            //   else {
            //     cursor = productsCollection.find({})
            //   }

            const result = await cursor.toArray();
            res.json(result)
        })


        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.findOne(query)
            res.json(result)
        })

        app.post('/orders', async (req, res) => {
            const cursor = req.body;
            const result = await ordersCollection.insertOne(cursor)
            res.json(result)

        })



        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let orders;
            const count = await cursor.count();

            if (page) {
                orders = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                orders = await cursor.toArray();
            }

            res.send({
                count,
                orders
            })

        })


        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: "Delivered",

                },
            };

            const result = await ordersCollection.updateOne(filter, updateDoc, options)
            res.json(result);

        })
        //users-------------------------------------------
        app.post('/users', async (req, res) => {

            const cursor = req.body;
            const orders = await usersCollection.insertOne(cursor)
            res.json(orders)

        })

        //user role update..................................
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'Admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isAdmin = false
            if (user?.role === "Admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })


    }


    finally {
        // await client.close()
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send(' Order Management System!')
})

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})