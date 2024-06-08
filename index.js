const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(express.json())
app.use(cors())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvnsypp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db('BloodDonate').collection('users')
        const districtsCollection = client.db('BloodDonate').collection('Districts')
        const upazilasCollection = client.db('BloodDonate').collection('Upazilas')
        const donationRequestCollection = client.db('BloodDonate').collection('donationRequest')
        const testimonialsCollection = client.db('BloodDonate').collection('Testimonials')

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.get('/districts', async (req, res) => {
            const result = await districtsCollection.find().toArray()
            res.send(result)
        })
        app.get('/upazilas', async (req, res) => {
            const result = await upazilasCollection.find().toArray()
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        // app.get('/admin-stats', async (req, res) => {
        //     const users = await usersCollection.estimatedDocumentCount()
        //     res.send(users)
        // })


        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
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
                    photo: userInfo.photo,
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
        // app.post('/users', async (req, res) => {
        //     const user = req.body;
        //     const query = { email: user.email }
        //     const existUser = await usersCollection.findOne(query)
        //     if (existUser) {
        //         return res.send({ message: 'user already exist', insertedId: null })
        //     }
        //     const result = await usersCollection.insertOne(user)
        //     res.send(result)
        // })
        //updated status
        app.patch('/statusUpdate/:email', async (req, res) => {
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
        app.patch('/updatedRole/:email', async (req, res) => {
            const user = req.body;
            const email = req.params.email;
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

        app.get('/create-donation-request/:requesterEmail', async (req, res) => {
            const requesterEmail = req.params.requesterEmail;
            const query = { requesterEmail: requesterEmail }
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

        //search btn
        app.get('/search', async (req, res) => {
            const category = req.query;
            console.log('category is', category)

            const query = { status: category.category }
            console.log('query is', query)


            const result = await donationRequestCollection.find(query).toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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