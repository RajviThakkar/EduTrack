require("dotenv").config()

const express = require("express")
const cors = require("cors")

const connectDB = require("./config/db")

const studentRoutes = require("./routes/studentRoutes")
const predictionRoutes = require("./routes/predictionRoutes")

const app = express()

// connect database
connectDB()

// middleware
app.use(cors())
app.use(express.json())

// routes
app.use("/student", studentRoutes)
app.use("/predict", predictionRoutes)

// simple test route
app.get("/", (req,res)=>{
 res.send("EduTrack backend running")
})

// server start
const PORT = process.env.PORT || 4000

app.listen(PORT, ()=>{
 console.log(`Server running on port ${PORT}`)
})