const {PrismaClient} = require('../generated/prisma');
const { list } = require('./UserController');
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res)=>{
        try{
            const { userId,empNo, section } = req.body;

            if (userId == null || section == null  || !String(section).trim()) {
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const user = await prisma.user.findFirst({
                where: {
                  id: parseInt(userId),
                  empNo: empNo,
                  accountState: 'use',
                },
              });

              if (!user) {
                return res.status(404).send({ message: 'user_not_found' });
              }

              const userSection = await prisma.userSections.create({
                data: {
                  userId: parseInt(userId) ,
                  section: section.trim(), // ตัด space
                },
                select: {
                  id: true,
                  userId: true,
                  section: true,
                  State: true,
                },
              });

            return res.send({
                message: 'create_user_section_success',
                data: userSection,
              });

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },

    list: async (req,res) =>{
        try{
            
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    }



}