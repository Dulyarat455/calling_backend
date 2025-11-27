const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {

create: async (req,res)=> {
    try{
        const { role, groupId, machineId, fromNodeId, toNodeId, jobStatus, userId, remark, createAt, closedAt } = req.body;

         //check Role
      if (role !== "admin") {
        return res.status(400).send({
          message: "Role_not_allowed",
        });
      }

      if (!role || !groupId || !machineId || !fromNodeId ||
            !jobStatus || !userId || !remark || !createAt || !closedAt || !userId
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
          jobStatus: parseInt(jobStatus),
          userId: parseInt(userId),
          remark: remark,
        },
      });

      return res.send({ message: "create new Group success", data});

    }catch(e){
        return res.status(500).send({ error: e.message });
    }
}







}

