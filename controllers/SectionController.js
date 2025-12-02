const {PrismaClient} = require('../generated/prisma');
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res) =>{
        try{
            const { name,role } = req.body;
             //check Role
            if (role !== "admin") {
                return res.status(400).send({ message: "Role_not_allowed" });
            }
            if (!name) {
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const checkSection = await prisma.sections.findFirst({
                where: {
                  name: name,
                  State: 'use',
                },
              });

              if (checkSection) {
                return res.status(400).send({ message: 'section_name_already' });
              }

              const section = await prisma.sections.create({
                data: {
                  name: name
                },
                select: {
                  id: true,
                  name: true,
                  State: true,
                },
              });

            return res.send({
                message: 'add_section_success',
                data: section,
            });
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },

    list: async(req,res)=>{
        try {
            const rows = await prisma.sections.findMany({
                       where: {
                           State: 'use'
                       }
                   })
                   return res.send({ results: rows })
        } catch (e) {
                   return res.status(500).send({ error: e.message });
        }
    },
    filterByGroup: async(req,res)=>{
      // ใช้ตอน addMember อย่างเดียวเพราะ ในตอน map position ยังไม่รู้ว่า section อยู่ group ไหน
      try{
          const {groupId} = req.body;
            // 1) validate sectionId
            const groupIdNum = Number(groupId);
            if (!groupId || Number.isNaN(groupIdNum)) {
            return res.status(400).send({
                message: 'invalid_group_id',
            });
            }

            const rows = await prisma.sections.findMany({
              where: {
                State: 'use', // section ยัง active
                CallNodes: {
                  some: {
                    groupId: groupIdNum,
                    isActive: 1,
                    State: 'use', // callnode ยังใช้ได้
                  },
                },
              },
              select: {
                id: true,
                name: true,
              },
            });
            return res.send({ results: rows });

      }catch(e){
          return res.status(500).send({ error: e.message });
      }
    }
}
