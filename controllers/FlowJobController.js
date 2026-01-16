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
    },
    edit: async (req, res) => {
        try {
          const { flowJobId, groupId, fromNodeId, toNodeId } = req.body;
      
      
          if (flowJobId == null) {
            return res.status(400).send({ message: "missing_flowJobId" });
          }
      
          // หา record เดิม
          const current = await prisma.flowJob.findFirst({
            where: {
              id: Number(flowJobId),
              State: "use",
            },
          });
      
          if (!current) {
            return res.status(404).send({ message: "FlowJob_not_found" });
          }
      
          // merge ค่าใหม่ / ค่าเดิม
          const nextGroupId = groupId != null ? Number(groupId) : current.groupId;
          const nextFromNodeId =
            fromNodeId != null ? Number(fromNodeId) : current.fromNodeId;
          const nextToNodeId =
            toNodeId != null ? Number(toNodeId) : current.toNodeId;
      
          // กันซ้ำ (ยกเว้นตัวเอง)
          const duplicate = await prisma.flowJob.findFirst({
            where: {
              State: "use",
              groupId: nextGroupId,
              fromNodeId: nextFromNodeId,
              toNodeId: nextToNodeId,
              NOT: { id: Number(flowJobId) },
            },
          });
      
          if (duplicate) {
            return res.status(400).send({ message: "FlowJob_already_exists" });
          }
      
          const updated = await prisma.flowJob.update({
            where: { id: Number(flowJobId) },
            data: {
              groupId: nextGroupId,
              fromNodeId: nextFromNodeId,
              toNodeId: nextToNodeId,
              status: "Active",      // ✅ บังคับ Active เสมอ
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
              Groups: { select: { id: true, name: true } },
            },
          });
      
          return res.send({
            message: "Edit_FlowJob_success",
            flowJob: updated,
          });
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },
      
      delete: async (req, res) => {
        try {
          const { flowJobId } = req.body;
      
      
          if (flowJobId == null) {
            return res.status(400).send({ message: "missing_flowJobId" });
          }
      
          const current = await prisma.flowJob.findFirst({
            where: {
              id: Number(flowJobId),
              State: "use",
            },
          });
      
          if (!current) {
            return res.status(404).send({ message: "FlowJob_not_found" });
          }
      
          const deleted = await prisma.flowJob.update({
            where: { id: Number(flowJobId) },
            data: {
              State: "delete",       // ✅ soft delete
              
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
              Groups: { select: { id: true, name: true } },
            },
          });
      
          return res.send({
            message: "Delete_FlowJob_success",
            flowJob: deleted,
          });
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },
      


}