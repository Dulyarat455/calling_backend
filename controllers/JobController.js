const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {

create: async (req,res)=> {
    try{
        //role gropName  check dashbord type 
        const { role, groupName, groupId, machineId, fromNodeId, toNodeId, userId, remark } = req.body;

         //check Role
      if (role !== "admin") {
        return res.status(400).send({
          message: "Role_not_allowed",
        });
      }

      if (role == null || groupName == null || groupId == null || machineId == null || fromNodeId == null ||
         userId == null || remark == null  || userId == null
         ) {
            return res
              .status(400)
              .send({ message: "missing_required_Groupfields" });
      }


      const job =  await prisma.job.create({
        data: {
          groupId: parseInt(groupId),
          machineId: parseInt(machineId),
          fromNodeId: parseInt(fromNodeId),
          toNodeId: parseInt(toNodeId),
          jobStatus: 1,
          userId: parseInt(userId),
          remark: remark,
        },
      });

      return res.send({ message: "create new Group success", data});

    }catch(e){
        return res.status(500).send({ error: e.message });
    }
},

list: async (req,res)=> {
  try{

  }catch(e){

  }
},

edit: async (req,res)=> {
  try{
    
  }catch(e){

  }
},

delete: async (req,res)=> {
  try{

  }catch(e){

  }
}








}

