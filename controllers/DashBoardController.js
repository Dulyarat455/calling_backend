const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {

listUnAuthentication: async (req,res)=>{
    try{

    }catch(e){
        return res.status(500).send({ error: e.message });
    }
},
listAuthentication: async(req,res)=>{
    try{

    }catch(e){
        return res.status(500).send({ error: e.message });
    }
},
addJob: async(req,res)=>{
    try{

    }catch(e){
        return res.status(500).send({ error: e.message });
    }
},
confirmJob: async(req,res)=>{
    try{

    }catch(e){
        return res.status(500).send({ error: e.message });
    }
},
cancelJob: async(req,res)=>{
    try{

    }catch(e){
        return res.status(500).send({ error: e.message });
    }   
},


}


