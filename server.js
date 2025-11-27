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
const machineController = require("./controllers/MachineController");
const groupController = require("./controllers/GroupController");
const userGroupController = require("./controllers/UserGroupController");
const userSectionController = require("./controllers/UserSectionController");
const sectionController = require("./controllers/SectionController");
const callNodeController = require("./controllers/CallNodeController");
const subSectionController = require("./controllers/SubSectionController")


// routing

//user controller
app.post("/api/user/create",(req,res)=>userController.create(req,res));
app.post("/api/user/signIn",(req,res)=>userController.signin(req,res));
app.post('/api/user/signin-rfid', (req, res) => userController.signinRfid(req, res))


//machines controller
app.post("/api/machine/add",(req,res)=> machineController.add(req,res));
app.get("/api/machine/list",(req,res)=> machineController.list(req,res));
app.put("/api/machine/edit",(req,res)=> machineController.edit(req,res));
app.delete("/api/machine/delete",(req,res)=> machineController.delete(req,res));

//Group controller
app.post("/api/group/add",(req,res)=> groupController.add(req,res));
app.get("/api/group/list",(req,res)=> groupController.list(req,res));
app.put("/api/group/edit",(req,res)=> groupController.edit(req,res));
app.delete("/api/group/delete",(req,res)=> groupController.delete(req,res));


//User Group controller 
app.post("/api/userGroup/add",(req,res)=> userGroupController.add(req,res));
app.get("/api/userGroup/list",(req,res)=> userGroupController.list(req,res));
app.put("/api/userGroup/edit",(req,res)=> userGroupController.edit(req,res));
app.delete("/api/userGroup/delete",(req,res)=> userGroupController)

//User Section  controller
app.post("/api/userSection/add",(req,res)=> userSectionController.add(req,res));
app.get("/api/userSection/list",(req,res)=> userSectionController.list(req,res));
app.put("/api/userSection/edit",(req,res)=> userSectionController.edit(req,res));
app.delete("/api/userSection/delete",(req,res)=> userSectionController.delete(req,res));


// section controller
app.post("/api/section/add",(req,res)=> sectionController.add(req,res));
app.get("/api/section/list",(req,res)=> sectionController.list(req,res));
app.put("/api/section/edit",(req,res)=> sectionController.edit(req,res));
app.delete("/api/section/delete",(req,res)=> sectionController.delete(req,res));
app.post("/api/section/filterByGroup",(req,res)=> sectionController.filterByGroup(req,res));

//callnode controller
app.post("/api/callnode/add",(req,res)=> callNodeController.add(req,res));
app.get("/api/callnode/list",(req,res)=> callNodeController.list(req,res));
app.put("/api/callnode/edit",(req,res)=> callNodeController.edit(req,res));
app.delete("/api/callnode/delete",(req,res)=> callNodeController.delete(req,res));

//subsection controller
app.post("/api/subsection/add",(req,res)=> subSectionController.add(req,res));
app.get("/api/subsection/list",(req,res)=> subSectionController.list(req,res));
app.put("/api/subsection/edit",(req,res)=> subSectionController.edit(req,res));
app.delete("/api/subsection/delete",(req,res)=> subSectionController.delete(req,res));
app.post("/api/subsection/filterBySection",(req,res)=> subSectionController.filterBySection(req,res));






app.get("/",(req,res) => {
    res.send("hello eiei")
})


app.get("/book/list", async(req, res) =>{
    const data = await prisma.book.findMany();
    res.send({ data: data });
});



app.listen(3001);



//require by P'ja 5.20 version prisma

// 3442348762



//  \\naspr01