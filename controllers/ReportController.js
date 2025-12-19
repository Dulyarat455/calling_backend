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
              User: true,
            },
          },
        },
      });
  
      // ✅ เอาเฉพาะ job ที่มี finish
      const finishJobs = jobs.filter((job) =>
        job.TimeStateJob.some(
          (ts) => (ts.StateJob?.name || '').toLowerCase() === 'finish'
        )
      );
  
      const results = finishJobs.map((job) => {
        // 1) Finish (เอาตัวแรกที่เจอ เพราะเรียง asc แล้ว ถ้ามี finish หลายอันแนะนำใช้ findLast ดูด้านล่าง)
        const finishState = job.TimeStateJob.find(
          (ts) => (ts.StateJob?.name || '').toLowerCase() === 'finish'
        );
  
        const finishStateInfo = finishState
          ? {
              date: finishState.date,
              stateJobId: finishState.stateJobId,
              stateJobName: finishState.StateJob?.name || null,
              userId: finishState.userInchargeId,
              userName: finishState.User?.name || null,
              userEmpNo: finishState.User?.empNo || null,
            }
          : null;
  
        // 2) Pending ล่าสุด (หาจาก TimeStateJob ที่เป็น pending)
        const pendingStates = job.TimeStateJob.filter(
          (ts) => (ts.StateJob?.name || '').toLowerCase() === 'pending'
        );
  
        const latestPending = pendingStates.length
          ? pendingStates[pendingStates.length - 1] // เพราะเรียง asc
          : null;
  
        const pendingStateInfo = latestPending
          ? {
              date: latestPending.date,
              stateJobId: latestPending.stateJobId,
              stateJobName: latestPending.StateJob?.name || 'pending',
              userId: latestPending.userInchargeId,
              userName: latestPending.User?.name || null,
              userEmpNo: latestPending.User?.empNo || null,
            }
          : null;
  
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
  
          userIncharge: finishStateInfo, // finish
          pendingUser: pendingStateInfo, // pending ล่าสุด (ถ้ามี)
        };
      });
  
      return res.send({ results });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },
  




}
