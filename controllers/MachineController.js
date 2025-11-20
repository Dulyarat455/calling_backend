const { error } = require('console');
const {PrismaClient} = require('../generated/prisma');
const { edit } = require('./GroupController');
const prisma = new PrismaClient();


module.exports = {

    add: async (req,res) => {
        try{
            const { code,groupId } = req.body;
            if (!code || !groupId) {
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
            return res.send({ results: rows })
        } catch (e) {
            return res.status(500).send({ error: e.message })
        }
    },
    edit: async(req,res) =>{
      try{

      }catch(e){
        return res.status(500).send({ error: e.message })
      }
    },
    delete: async(req,res) =>{
      try{

      }catch(e){
        return res.status(500).send({ error: e.message })
      }
    }









}
