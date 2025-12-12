const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {
    list: async (req, res) => {
        try {
    
          const jobs = await prisma.job.findMany({
            where: { State: 'use' },
            orderBy: { createAt: 'desc' },
            include: {
              Groups: true,
              Machines: true,
              fromNode: true,
              toNode: true,
              User: true,
              TimeStateJob: {
                where: { State: 'use' },
                orderBy: { date: 'asc' },
                include: {
                  StateJob: true,
                  User: true
                }
              }
            }
          });
    
          const results = jobs.map(job => {
    
            // 🎯 1) หาข้อมูล TimeStateJob ที่เป็น "Finish"
            const finishState = job.TimeStateJob.find(
              ts => ts.StateJob?.name?.toLowerCase() === "finish"
            );
    
            // 🎯 2) สร้าง object finishStateInfo (อาจเป็น null ถ้าไม่มี)
            const finishStateInfo = finishState ? {
              date: finishState.date,
              stateJobId: finishState.stateJobId,
              stateJobName: finishState.StateJob?.name || null,
              userId: finishState.userInchargeId,
              userName: finishState.User?.name || null,
              userEmpNo: finishState.User?.empNo || null
            } : null;
    
            return {
              jobId: job.id,
              groupId: job.groupId,
              groupName: job.Groups?.name ?? null,
    
              machineId: job.machineId,
              machineName: job.Machines?.code ?? null,
    
              fromNodeId: job.fromNodeId,
              fromNodeName: job.fromNode?.code ?? null,
    
              toNodeId: job.toNodeId,
              toNodeName: job.toNode?.code ?? null,
    
              createByUserId: job.createByUserId,
              createByuserName: job.User?.name ?? null,
              createByuserEmpNo: job.User?.empNo ?? null,
    
              createAt: job.createAt,
    
              // ✅ ส่งมาเป็น object เดียว ไม่ใช่ array แล้ว
              userIncharge: finishStateInfo
            };
          });
    
          return res.send({ results });
    
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },




}
