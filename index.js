const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// const corsOptions = {
//     origin: 'http://localhost:5173', // Your frontend URL
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
//     credentials: true, // Allow cookies to be sent with the request
//     optionsSuccessStatus: 200 // Some legacy browsers choke on 204
// };

//middleware
app.use(express.json())
// app.use(cors(corsOptions))
app.use(cors({
    origin: ['http://localhost:5173', 'https://reddrop-bd.web.app']
}))


// const corsOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production" ? true : false,
//     sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
// };

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvnsypp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


//middlewares
const verifyToken = async (req, res, next) => {
    // console.log('inside verify token', req.headers.authorization)

    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = req.headers.authorization.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;

        next()
    })

}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const usersCollection = client.db('BloodDonate').collection('users')
        const districtsCollection = client.db('BloodDonate').collection('Districts')
        const upazilasCollection = client.db('BloodDonate').collection('Upazilas')
        const donationRequestCollection = client.db('BloodDonate').collection('donationRequest')
        const testimonialsCollection = client.db('BloodDonate').collection('Testimonials')


        //verify admin

        //use verify admin after verify token
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)

            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }
        //use verify admin after verify token
        const verifyAdminAndVolunteer = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)

            const isAdminOrVolun = user?.role === 'admin' || user?.role === 'volunteer'
            if (!isAdminOrVolun) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

        //jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body //playload eta client site theke ashbe
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        //user related api
        app.get('/users', verifyToken, async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        //check admin role
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query)

            let admin = false
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin })
        })
        //check admin and volunteer role
        app.get('/users/adminorVolun/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query)

            let adminOrVolun = false
            if (user) {
                adminOrVolun = user?.role === 'admin' || user?.role === 'volunteer'
            }
            res.send({ adminOrVolun })
        })

        app.get('/districts', async (req, res) => {
            const result = await districtsCollection.find().toArray()
            res.send(result)
        })
        app.get('/upazilas', async (req, res) => {
            const result = await upazilasCollection.find().toArray()
            res.send(result)
        })



        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        //search all users filter
        app.get('/users/admin-allUsers', async (req, res) => {

            const category = req.query;
            const query = { status: category.category }

            if (category.category === '') {
                const result = await usersCollection.find().toArray()
                return res.send(result)
            }
            const result = await usersCollection.find(query).toArray()
            res.send(result)

        })

        //search all donation filter
        app.get('/filter-all-donations', async (req, res) => {
            const category = req.query;
            const query = { status: category.category }

            if (category.category === '') {
                const result = await donationRequestCollection.find().toArray()
                return res.send(result)
            }
            const result = await donationRequestCollection.find(query).toArray()
            res.send(result)
        })



        app.put('/usercreate/:email', async (req, res) => {
            const userInfo = req.body;
            const email = req.params.email
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {

                    name: userInfo.name,
                    email: userInfo.email,
                    photoURL: userInfo.photoURL,
                    bloodGroup: userInfo.bloodGroup,
                    district: userInfo.district,
                    upazila: userInfo.upazila,
                    status: userInfo.status,
                    role: userInfo.role
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.patch('/statusUpdate/admin/:email', async (req, res) => {
            const user = req.body;
            const email = req.params.email;
            const filter = { email: email }
            const updatedDoc = {
                $set: {
                    status: user.updatedStatus
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        //updatd role 
        app.patch('/user/role/admin/:email', async (req, res) => {
            const user = req.body;
            console.log(user)
            const email = req.params.email;
            console.log(email)
            const filter = { email: email }
            const updatedDoc = {
                $set: {
                    role: user.updatedRole
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })



        //updated profile
        app.patch('/updateProfile/:email', async (req, res) => {
            const updatedinfo = req.body
            console.log(updatedinfo)
            const email = req.params.email
            const filter = { email: email }

            const updatedDoc = {
                $set: {
                    name: updatedinfo.name,
                    bloodGroup: updatedinfo.bloodGroup,
                    district: updatedinfo.district,
                    upazila: updatedinfo.upazila,
                    photoURL: updatedinfo.photoURL,
                }
            }
            console.log(req.body)
            const result = await usersCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // donation request related api

        app.get('/create-donation-request', async (req, res) => {


            const result = await donationRequestCollection.find().toArray()
            res.send(result)
        })


        //my
        app.get('/create-donation-request/:requesterEmail', async (req, res) => {
            const requesterEmail = req.params.requesterEmail;
            const category = req.query;
            const query = { requesterEmail: requesterEmail, status: category.category }
            console.log(query)

            if (category.category === '') {
                query2 = { requesterEmail: requesterEmail }
                const result = await donationRequestCollection.find(query2).toArray()
                return res.send(result)
            }

            const result = await donationRequestCollection.find(query).toArray()
            res.send(result)
        })

        //last/recent three data get
        app.get('/recentThreeData/:email', async (req, res) => {
            const email = req.params.email
            const query = { requesterEmail: email }

            const result = await donationRequestCollection.find(query).sort({ createdAt: 1 }).limit(3).toArray();
            res.send(result)
        })


        app.get('/updated-donation-request', async (req, res) => {

            const result = await donationRequestCollection.find().toArray()
            res.send(result)
        })

        app.get('/donation-request/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await donationRequestCollection.findOne(query)
            res.send(result)
        })



        app.patch('/updated-request/:id', async (req, res) => {
            const updatedinfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    recipientName: updatedinfo.recipientName,
                    hospitalName: updatedinfo.hospitalName,
                    bloodGroup: updatedinfo.bloodGroup,
                    district: updatedinfo.district,
                    upazila: updatedinfo.upazila,
                    requestMessage: updatedinfo.requestMessage,
                    fullAddress: updatedinfo.fullAddress,
                    donateDate: updatedinfo.donateDate,
                    donateTime: updatedinfo.donateTime,
                    requesterName: updatedinfo.requesterName,
                    requesterEmail: updatedinfo.requesterEmail,
                    status: updatedinfo.status,

                }
            }
            const result = await donationRequestCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.post('/create-donation-request', async (req, res) => {
            const donationDetails = req.body;
            const result = await donationRequestCollection.insertOne(donationDetails)
            res.send(result)
        })


        app.delete('/donation-request-delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await donationRequestCollection.deleteOne(query)
            res.send(result)
        })

        //donar agree donate blood
        app.put('/donarDonateBlood/:id', async (req, res) => {
            const donarConfirmData = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    bloodDonarName: donarConfirmData.bloodDonarName,
                    bloodDonarEmail: donarConfirmData.bloodDonarEmail,
                    status: donarConfirmData.status
                }
            }
            const result = await donationRequestCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        //status done when status is inprogress
        app.patch('/changeStatus/:id', async (req, res) => {
            const updatedStatus = req.body
            console.log(updatedStatus)
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }

            const updatedDoc = {
                $set: {
                    status: updatedStatus.status
                }
            }
            const result = await donationRequestCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        //testimonial api
        app.get('/testimonials', async (req, res) => {
            const result = await testimonialsCollection.find().toArray()
            res.send(result)
        })


        //search all blood donation filter search
        app.get('/search-blood-donation-all', async (req, res) => {


            const category = req.query;


            const query = { bloodGroup: category.bloodGroup, district: category.district, upazila: category.upazila }




            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Blood Donate Server is Working')
})

app.listen(port, () => {
    console.log(`this server is runnig on port ${port}`)
})