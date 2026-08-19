const express = require("express");
const { listServices } = require("../controllers/servicesController");

const router = express.Router();

router.get("/", listServices);

module.exports = router;
