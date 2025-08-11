const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
// app.use(cors(corsOptions))
app.use(
  cors({
    origin: ["http://localhost:5173", "https://reddrop-bd.web.app"],
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvnsypp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const dailyIncomeCollection = client
      .db("StyleMan")
      .collection("dailyIncome");
    const dailyExpenseCollection = client
      .db("StyleMan")
      .collection("dailyExpense");
    app.get("/dailyIncome", async (req, res) => {
      try {
        const { filterBy, month, year } = req.query;

        const dailyIncomes = await dailyIncomeCollection.find().toArray();

        // Date parsing helper (যেহেতু DB থেকে date স্ট্রিং আসে)
        const parseDate = (dateStr) => new Date(dateStr);

        let filtered = dailyIncomes;

        if (filterBy === "today") {
          const today = new Date();
          filtered = dailyIncomes.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getDate() === today.getDate() &&
              dateObj.getMonth() === today.getMonth() &&
              dateObj.getFullYear() === today.getFullYear()
            );
          });
        } else if (filterBy === "month" && month && year) {
          filtered = dailyIncomes.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getMonth() + 1 === parseInt(month, 10) &&
              dateObj.getFullYear() === parseInt(year, 10)
            );
          });
        } else if (filterBy === "year" && year) {
          filtered = dailyIncomes.filter((item) => {
            const dateObj = parseDate(item.date);
            return dateObj.getFullYear() === parseInt(year, 10);
          });
        }

        res.status(200).send(filtered);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/todayIncome", async (req, res) => {
      try {
        const incomes = await dailyIncomeCollection.find().toArray();

        const today = new Date();

        // আজকের তারিখ ফিল্টার
        const todayIncomes = incomes.filter((item) => {
          const dateObj = new Date(item.date);
          return (
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear()
          );
        });

        // মোট আয় বের করা
        const totalIncome = todayIncomes.reduce((sum, item) => {
          const price = Number(item.offerPrice) || Number(item.price) || 0;
          return sum + price;
        }, 0);

        res.send({ totalIncome });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/dailyIncome", async (req, res) => {
      const dailyIncome = req.body;
      const result = await dailyIncomeCollection.insertOne(dailyIncome);
      res.send(result);
    });

    const { ObjectId } = require("mongodb");

    app.delete("/dailyIncome/:id", async (req, res) => {
      try {
        const getId = req.params.id;
        const id = {
          _id: new ObjectId(getId),
        };
        const result = await dailyIncomeCollection.deleteOne(id);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error deleting document", error });
      }
    });

    //   Expense
    app.get("/dailyExpense", async (req, res) => {
      try {
        const { filterBy, month, year } = req.query;

        const dailyExpenses = await dailyExpenseCollection.find().toArray();

        // Parse date string from DB
        const parseDate = (dateStr) => new Date(dateStr);

        let filtered = dailyExpenses;

        if (filterBy === "today") {
          const today = new Date();
          filtered = dailyExpenses.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getDate() === today.getDate() &&
              dateObj.getMonth() === today.getMonth() &&
              dateObj.getFullYear() === today.getFullYear()
            );
          });
        } else if (filterBy === "month" && month && year) {
          filtered = dailyExpenses.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getMonth() + 1 === parseInt(month, 10) &&
              dateObj.getFullYear() === parseInt(year, 10)
            );
          });
        } else if (filterBy === "year" && year) {
          filtered = dailyExpenses.filter((item) => {
            const dateObj = parseDate(item.date);
            return dateObj.getFullYear() === parseInt(year, 10);
          });
        }

        res.status(200).send(filtered);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/todayExpense", async (req, res) => {
      try {
        const expenses = await dailyExpenseCollection.find().toArray();

        const today = new Date();

        // আজকের তারিখ ফিল্টার
        const todayExpense = expenses.filter((item) => {
          const dateObj = new Date(item.date);
          return (
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear()
          );
        });

        // মোট আয় বের করা
        const totalExpenses = todayExpense.reduce((sum, item) => {
          const price = Number(item.offerPrice) || Number(item.price) || 0;
          return sum + price;
        }, 0);

        res.send({ totalExpenses });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/dailyExpense", async (req, res) => {
      try {
        const dailyExpense = req.body;
        const result = await dailyExpenseCollection.insertOne(dailyExpense);
        res.send(result);
      } catch (error) {
        console.error("Error inserting daily expense:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.delete("/dailyExpense/:id", async (req, res) => {
      try {
        const getId = req.params.id;
        const id = {
          _id: new ObjectId(getId),
        };
        const result = await dailyExpenseCollection.deleteOne(id);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error deleting document", error });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("StyleMan Server is Working");
});

app.listen(port, () => {
  console.log(`this server is runnig on port ${port}`);
});
