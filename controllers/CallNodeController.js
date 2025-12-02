const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res)=>{
        try{
        const { role, code, subSectionId, sectionId, groupId } = req.body;
        
        //check Role
        if (role !== "admin") {
            return res.status(400).send({
            message: "Role_not_allowed",
            });
        }

        if (!String(code).trim() || subSectionId == null || sectionId == null || groupId == null) {
            return res.status(400).send({ message: 'missing_required_fields' });
          }
        
        //check ซ้ำ
        const existCallnode = await prisma.callNodes.findFirst({
            where: {
                State: 'use',       
                code: code,
                sectionId: sectionId,
                subSectionId: subSectionId,
                groupId: groupId 
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
                groupId: Number(groupId),
                sectionId: Number(sectionId),
                subSectionId: Number(subSectionId)
            },
            select: {
                id: true,
                code: true,
                subSectionId: true,
                sectionId: true,
                groupId: true,
                isActive: true,
                State: true,
                Sections: { select: { id: true, name: true } },
                Groups: { select: { id: true, name: true } },
                SubSections: { select: {id: true, name: true} }
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
                },
                select:{
                    id: true,
                    code: true,
                    subSectionId: true,
                    sectionId: true,
                    groupId: true,
                    isActive: true,
                    State: true,
                    Sections: { select: { id: true, name: true } },
                    Groups: { select: { id: true, name: true } },
                    SubSections: { select: { id: true, name: true } },
                }
            })
            const results = rows.map((r) => ({
                id: r.id,
                code: r.code,
        
                sectionId: r.sectionId,
                sectionName: r.Sections?.name ?? null,
        
                groupId: r.groupId,
                groupName: r.Groups?.name ?? null,
        
                subSectionId: r.subSectionId,
                subSectionName: r.SubSections?.name ?? null,

                isActive: r.isActive,
                state: r.State,
              }));
        
              return res.send({ results });
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },

    filterByGroup: async (req,res) => {
        try{
            const { groupId } = req.body;
            const rows = await prisma.callNodes.findMany({
                where:{
                    State: "use",
                    groupId: parseInt(groupId)
                },
                select:{
                    id: true,
                    code: true,
                    subSectionId: true,
                    sectionId: true,
                    groupId: true,
                    isActive: true,
                    State: true,
                    Sections: { select: { id: true, name: true } },
                    Groups: { select: { id: true, name: true } },
                    SubSections: { select: { id: true, name: true } },
                }
            })
            const results = rows.map((r) => ({
                id: r.id,
                code: r.code,
        
                sectionId: r.sectionId,
                sectionName: r.Sections?.name ?? null,
        
                groupId: r.groupId,
                groupName: r.Groups?.name ?? null,
        
                subSectionId: r.subSectionId,
                subSectionName: r.SubSections?.name ?? null,

                isActive: r.isActive,
                state: r.State,
              }));
              return res.send({ results });

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
