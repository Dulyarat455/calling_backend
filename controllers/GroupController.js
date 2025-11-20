const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

module.exports = {
  add: async (req, res) => {
    try {
      const { name, role } = req.body;
      if (!name) {
        return res
          .status(400)
          .send({ message: "missing_required_Groupfields" });
      }

      //check Role
      if (role !== "admin") {
        return res.status(400).send({
          message: "Role_not_allowed",
        });
      }

      const existGroup = await prisma.groups.findFirst({
        where: {
          name: name
        },
      });
      if (existGroup) {
        return res.status(400).send({
          message: "Group_already_exists",
        });
      }

      const group =  await prisma.groups.create({
        data: {
          name: name,
        },
      });
      return res.send({ message: "create new Group success", group});
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  list: async (req, res) => {
    try{
        const rows = await prisma.groups.findMany({
            where: {
                State: 'use'
            }
        })
        return res.send({ results: rows })

    }catch(e){
        return res.status(500).send({ error: e.message });
    }

  },
  edit: async(req, res)=>{
    try{

    }catch(e){
      return res.status(500).send({ error: e.message });
    }
  },
  delete: async(req,res)=>{
    try{

    }catch(e){
      return res.status(500).send({ error: e.message });
    }
  }


};
