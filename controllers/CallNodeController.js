const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res)=>{
        try{
        const { role, code, label, sectionId, groupId } = req.body;
        
        //check Role
        if (role !== "admin") {
            return res.status(400).send({
            message: "Role_not_allowed",
            });
        }

        if (!String(code).trim() || !String(label).trim() || !sectionId || !groupId) {
            return res.status(400).send({ message: 'missing_required_fields' });
          }

        //check ซ้ำ
        const existCallnode = await prisma.callNodes.findFirst({
            where: {
                State: 'use',       
                OR: [
                  { code: code },
                  { label: label },
                ],
            },
          });
          if (existCallnode) {
            return res.status(400).send({
              message: "Position_already_exists",
            });
          }
          

          const callNode =  await prisma.callNodes.create({
            data: {
                code : code,
                label: label,
                sectionId: Number(sectionId),
                groupId: Number(groupId)
            },
            select: {
                id: true,
                code: true,
                label: true,
                isActive: true,
                State: true,
                Sections: { select: { id: true, name: true } },
                Groups: { select: { id: true, name: true } },
              },
          });
          return res.send({
            message: 'create_position_success',
            callNode,
          });

        }catch(e){
            return res.status(500).send({ error: e.message }); 
        }
    },
    list: async (req,res) =>{
        try{
            const rows = await prisma.callNodes.findMany({
                where: {
                    State: 'use'
                }
            })
            return res.send({ results: rows })
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },
    edit: async (req,res) =>{
        try{

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },
    delete: async (req,res) =>{
        try{
            
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    }

}
