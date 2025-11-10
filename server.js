// npx prisma init --datasource-provider sqlserver
const express = require('express');
const app = express();

const { PrismaClient } = require('./generated/prisma')
const bodyParser = require('body-parser');
const prisma = new PrismaClient();
const dotenv  = require("dotenv");
const cors = require("cors")


dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true})
)

//call parth controller
const userController = require("./controllers/UserController");


// routing

//user
app.post("/api/user/create",(req,res)=>userController.create(req,res));
app.post("/api/user/signIn",(req,res)=>userController.signin(req,res));



app.get("/",(req,res) => {
    res.send("hello eiei")
})


app.get("/book/list", async(req, res) =>{
    const data = await prisma.book.findMany();
    res.send({ data: data });
});



app.listen(3001);



//require by P'ja 5.20 version prisma