const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {

create: async (req,res)=> {
    try{
        //role gropName  check dashbord type 
        const { groupId, machineId, fromNodeId, toNodeId, userId, remark, priority } = req.body;

      if ( groupId == null || machineId == null || fromNodeId == null ||
         userId == null || toNodeId == null || !priority) {
            return res
              .status(400)
              .send({ message: "missing_required_fields" });
      }
      const result =  await prisma.$transaction(async (tx)=> {

        const job =  await tx.job.create({
          data: {
            groupId: parseInt(groupId),
            machineId: parseInt(machineId),
            fromNodeId: parseInt(fromNodeId),
            toNodeId: parseInt(toNodeId),
            createByUserId: parseInt(userId),
            remark: remark || '',
            priority: priority
          }, 
          include:{
            Groups: true,
            Machines: true,
            User: true,
            fromNode: true,
            toNode: true 
          }
        });
        const timeStateJob = await tx.timeStateJob.create({
          data:{
            date: new Date(),
            stateJobId: 1, //wait state
            jobId: job.id,
            userInchargeId:  parseInt(userId),
          }
        })
        const jobRecord = await tx.jobRecord.create({
          data:{
            groupName: job.Groups.name ,
            machineName: job.Machines.code,
            createByUserName: job.User.name,
            remark: remark || '' ,
            fromNodeName: job.fromNode.code ,
            toNodeName:  job.toNode.code ,
            jobId: job.id

          }
        })
        return { job, timeStateJob, jobRecord };
      })

       // ✅ ส่งสัญญาณไปให้ทุก client รู้ว่ามีการเปลี่ยนแปลง
       if (global.io) {
        global.io.emit('job:changed', { type: 'create', ...result });
      }

      return res.send({ message: "Assign job success",  ...result, });
    }catch(e){
        return res.status(500).send({ error: e.message });
    }
},

list: async (req,res)=> {   
  try{
    const rows = await prisma.job.findMany({
      where: {
          State: 'use'
      },
      select:{
        id: true,
        groupId: true,
        machineId: true,
        fromNodeId: true,
        toNodeId: true,
        createByUserId: true,
        remark: true ,
        fromNode: { select: { id: true, code: true } },
        toNode: {select: {id: true, code: true}},
        User: {select: {id: true, name: true, empNo: true}},
        Machines : {select: {id: true, code: true}},
        Groups: {select: {id: true, name: true}},
        
        TimeStateJob: {
          where: { State: 'use' },          // เอาเฉพาะที่ไม่ถูกลบ
          orderBy: { date: 'desc' },        // ล่าสุดก่อน 
          select: {
            id: true,
            date: true,
            stateJobId: true,
            userInchargeId: true,
            StateJob: { select: { id: true, name: true } },
            User: { select: { id: true, name: true } },
          },
        },

        
      }
    })
    const results = rows.map((r) => ({
      id: r.id,
      createByUserId: r.User.id,
      createByUserName: r.User.name,
      createByUserEmpNo: r.User.empNo,
      remark: r.remark,
      machineId: r.Machines.id,
      machineName: r.Machines.code,
      groupId: r.Groups.id,
      groupName: r.Groups.name,
      fromNodeId: r.fromNode.id,
      fromNodeName: r.fromNode.code,
      toNodeId: r.toNode.id,
      toNodeName: r.toNode.code,
      states: r.TimeStateJob.map(s => ({
        id: s.id,
        stateJobId: s.stateJobId,
        stateJobName: s.StateJob?.name || null,
        userInchargeId: s.userInchargeId,
        userInchargeName: s.User?.name || null,
        date: s.date
      }))

    }));


    return res.send({ results });

  }catch(e){
    return res.status(500).send({ error: e.message });
  }
},

filterByGroup : async (req,res)=> {
  try{
    const { groupId } = req.body;

    const rows = await prisma.job.findMany({
      where: {
        State: 'use',
        groupId: parseInt(groupId),

        // ✅ เข้มกว่า: job ต้อง "ไม่มี" TimeStateJob ที่ stateJobId = 3 เลย
        TimeStateJob: {
          none: {
            State: 'use',
            stateJobId: 3,
          },
        },
      },
      select: {
        id: true,
        groupId: true,
        machineId: true,
        fromNodeId: true,
        toNodeId: true,
        createByUserId: true,
        createAt: true,
        remark: true,
        priority: true,
        fromNode: { select: { id: true, code: true } },
        toNode: { select: { id: true, code: true } },
        User: { select: { id: true, name: true, empNo: true } },
        Machines: { select: { id: true, code: true } },
        Groups: { select: { id: true, name: true } },

        // output states "ตามเดิม" แต่ถ้าจะไม่เอา 3 ใน states ด้วยก็ใส่ not: 3 ไว้ได้
        TimeStateJob: {
          where: {
            State: 'use',
            stateJobId: { not: 3 }, // (จะใส่หรือไม่ใส่ก็ได้ เพราะ job ที่มี 3 ถูกตัดทิ้งแล้ว)
          },
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            stateJobId: true,
            userInchargeId: true,
            StateJob: { select: { id: true, name: true } },
            User: { select: { id: true, name: true, empNo: true } },
          },
        },
      },
    });

    const results = rows.map((r) => ({
      id: r.id,
      createAt: r.createAt,
      createByUserId: r.User.id,
      createByUserName: r.User.name,
      createByUserEmpNo: r.User.empNo,
      remark: r.remark,
      priority: r.priority,
      machineId: r.Machines.id,
      machineName: r.Machines.code,
      groupId: r.Groups.id,
      groupName: r.Groups.name,
      fromNodeId: r.fromNode.id,
      fromNodeName: r.fromNode.code,
      toNodeId: r.toNode.id,
      toNodeName: r.toNode.code,
      states: r.TimeStateJob.map(s => ({
        id: s.id,
        stateJobId: s.stateJobId,
        stateJobName: s.StateJob?.name || null,
        userInchargeId: s.userInchargeId,
        userInchargeName: s.User?.name || null,
        userInchargeEmpNo: s.User?.empNo || null,
        date: s.date
      })),
    }));

    return res.send({ results });

  } catch(e){
    return res.status(500).send({ error: e.message });
  }
},



updateJob: async(req,res)=> {
  try{
    const {jobId, userId, action} = req.body

    if ( jobId == null  ||  userId == null  || !action ) {
         return res
           .status(400)
           .send({ message: "missing_required_fields" });
   }

   const job = await prisma.job.findFirst({
    where: {
      id : jobId,
      State: 'use',
    },
   })

   if (!job) {
    return res.status(400).send({ message: 'This job not found' });
  }

 let timeStateJob = null ;

  if(action ===  'accept'){
   timeStateJob = await prisma.timeStateJob.create({
      data:{
        date: new Date(),
        stateJobId: 2, //pending state
        jobId: jobId,
        userInchargeId:  parseInt(userId),
      }
    })
  }

  if(action === 'cancel'){
     timeStateJob = await prisma.timeStateJob.create({
      data:{
        date: new Date(),
        stateJobId: 1, //wait state
        jobId: jobId,
        userInchargeId:  parseInt(userId),
      }
    })
  }

  if(action === 'confirm'){
     timeStateJob = await prisma.timeStateJob.create({
      data:{
        date: new Date(),
        stateJobId: 3, //finish state
        jobId: jobId,
        userInchargeId:  parseInt(userId),
      }
    })
  }

  // ✅ ส่งสัญญาณไปให้ทุก client รู้ว่ามีการเปลี่ยนแปลง
  if (global.io) {
    global.io.emit("job:changed", {
      type: "update",
      timeStateJob,
      job,
    });
  }

 return res.send({ message: "update state job success"}); 

  }catch(e){
    return res.status(500).send({ error: e.message });
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

