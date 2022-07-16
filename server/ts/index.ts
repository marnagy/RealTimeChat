import express from "express";
import bodyParser from "body-parser";

const app = express()

// for reading POST messages
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))


