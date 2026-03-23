const express = require("express")
const router = express.Router()

const { predictRisk } = require("../controllers/predictionController")

router.post("/:id", predictRisk)

module.exports = router