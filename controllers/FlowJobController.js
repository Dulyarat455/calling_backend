const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res)=>{
        try{
            const { role, groupId, fromNodeId, toNodeId } = req.body;

            if(role !== "admin"){
                return res.status(400).send({
                    message: "Role_not_allowed",
                    });
            }

            if ( fromNodeId == null || toNodeId == null || groupId == null) {
                return res.status(400).send({ message: 'missing_required_fields' });
              }

             //check ซ้ำ

             const existFlowJob = await prisma.flowJob.findFirst({
                where: {
                    State: 'use',       
                    groupId: Number(groupId),
                    fromNodeId: Number(fromNodeId),
                    toNodeId: Number(toNodeId)
                },
              });
              if (existFlowJob) {
                return res.status(400).send({
                  message: "FlowJob_already_exists",
                });
              }


              const flowJob =  await prisma.flowJob.create({
                data: {
                    groupId: Number(groupId),
                    fromNodeId: Number(fromNodeId),
                    toNodeId: Number(toNodeId),
                    status: "Active"
                },
                select: {
                    id: true,
                    groupId: true,
                    fromNodeId: true,
                    toNodeId: true,
                    State: true,
                    status: true,
                    fromNode: { select: { id: true, code: true } },
                    toNode: { select: { id: true, code: true } },
                    Groups: { select: {id: true, name: true }}
                },
              });

              return res.send({
                message: 'Map_FlowJob_success',
                flowJob,
              });

        }catch(e){
            return res.status(500).send({ error: e.message }); 
        }
    },
    list: async (req,res)=>{
        try{
            const rows = await prisma.flowJob.findMany({
                where: {
                    State: 'use'
                },
                select:{
                    id: true,
                    groupId: true,
                    fromNodeId: true,
                    toNodeId: true,
                    State: true,
                    status: true,
                    Groups: { select: { id: true, name: true } },
                    fromNode: { select: { id: true, code: true } },
                    toNode: { select: { id: true, code: true } },
                }
            })

            const results = rows.map((r) => ({
                id: r.id,
                state: r.State,
                status: r.status,
                groupId: r.groupId,
                groupName: r.Groups?.name ?? null,
                fromNodeId: r.fromNodeId,
                fromNodeName:  r.fromNode?.code ?? null,
                toNodeId: r.toNodeId,
                toNodeName: r.toNode?.code ?? null,
              }));
              return res.send({ results });
            
        }catch(e){
            return res.status(500).send({ error: e.message }); 
        }
    }

}