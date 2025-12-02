const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {

create: async (req,res)=> {
    try{
        //role gropName  check dashbord type 
        const { groupName, groupId, machineId, fromNodeId, toNodeId, userId, remark } = req.body;

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
          createByUserId: parseInt(userId),
          remark: remark,
        },
      });

      const timeStateJob = await prisma.timeStateJob.create({
        data:{
          date: new Date(),
          stateJobId: stateJobId,
          
           
        }
      })

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

