const { error } = require('console');
const {PrismaClient} = require('../generated/prisma');
const { edit } = require('./GroupController');
const { filterByGroup } = require('./SectionController');
const prisma = new PrismaClient();


module.exports = {

    add: async (req,res) => {
        try{
            const { code,groupId } = req.body;
            if (code == null  || groupId == null) {
                return res.status(400).send({ message: 'missing_required_fields' });
              }

              const checkMachine = await prisma.machines.findFirst({
                where: {
                  code: code,
                  groupId: groupId,
                  State: 'use',
                },
              });
              
              if (checkMachine) {
                return res.status(400).send({ message: 'Group_already_exists' });
              }

              const machine = await prisma.machines.create({
                data: {
                  code: code ,
                  groupId: parseInt(groupId)
                },
                select: {
                  id: true,
                  code: true,
                  groupId: true,
                  State: true,
                },
              });

          return res.send({ message: "create machine success",data: machine });      

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },

    list: async (req,res) =>{
          try {
            const rows = await prisma.machines.findMany({
                where: {
                    State: 'use'
                },
                include:{
                  Groups:{
                    select:{
                      id: true,
                      name: true
                    }
                  }
                }
            })
            return res.send({ results: rows });
        } catch (e) {
            return res.status(500).send({ error: e.message });
        }
    },

    filterByGroup: async(req,res)=>{
      try{
        const { groupId } = req.body;
        const rows = await prisma.machines.findMany({
          where:{
            State: 'use',
            groupId: parseInt(groupId)
          },
          include:{
            Groups:{
              select:{
                id: true,
                name: true
              }
            }
          }
        })
        return res.send({results: rows});
      }catch(e){
        return res.status(500).send({ error: e.message });
      }
    },



    edit: async (req, res) => {
      try {
        const { machineId, code, groupId } = req.body;
    
        if (machineId == null) {
          return res.status(400).send({ message: "missing_required_fields" });
        }
    
        const current = await prisma.machines.findFirst({
          where: { id: parseInt(machineId), State: "use" },
          select: { id: true, code: true, groupId: true, State: true },
        });
    
        if (!current) {
          return res.status(404).send({ message: "machine_not_found" });
        }
    
        // ถ้าไม่ส่งอะไรมาเลย ก็ไม่ต้องอัปเดต
        const nextCode = (code ?? current.code);
        const nextGroupId = (groupId != null ? parseInt(groupId) : current.groupId);
    
        // กันซ้ำ: code + groupId ซ้ำกับเครื่องอื่น (State=use)
        const dup = await prisma.machines.findFirst({
          where: {
            id: { not: current.id },
            code: nextCode,
            groupId: nextGroupId,
            State: "use",
          },
          select: { id: true },
        });
    
        if (dup) {
          return res.status(400).send({ message: "machine_already_exists" });
        }
    
        const updated = await prisma.machines.update({
          where: { id: current.id },
          data: {
            code: nextCode,
            groupId: nextGroupId,
          },
          select: {
            id: true,
            code: true,
            groupId: true,
            State: true,
          },
        });
    
        return res.send({ message: "update machine success", data: updated });
      } catch (e) {
        return res.status(500).send({ error: e.message });
      }
    },
    
    delete: async (req, res) => {
      try {
        const { machineId } = req.body;
    
        if (machineId == null) {
          return res.status(400).send({ message: "missing_required_fields" });
        }
    
        const current = await prisma.machines.findFirst({
          where: { id: parseInt(machineId), State: "use" },
          select: { id: true },
        });
    
        if (!current) {
          return res.status(404).send({ message: "machine_not_found" });
        }
    
        // ✅ Soft delete
        const deleted = await prisma.machines.update({
          where: { id: current.id },
          data: { State: "delete" }, // หรือ "inactive" ตามที่คุณกำหนด
          select: {
            id: true,
            code: true,
            groupId: true,
            State: true,
          },
        });
    
        return res.send({ message: "delete machine success", data: deleted });
      } catch (e) {
        return res.status(500).send({ error: e.message });
      }
    },
    



}
