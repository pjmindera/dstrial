var express = require("express");
var router = express.Router();

const { homey, sign, dsreturn } = require("../docusign.js");

/* GET home page. */
router.get("/", homey);
router.post("/sign", sign);
router.get("/dsreturn", dsreturn);

module.exports = router;
