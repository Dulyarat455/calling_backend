const {PrismaClient} = require('../generated/prisma');
const prisma = new PrismaClient();


module.exports = {
    Add: async (req,res)=>{
        try{
            const { userId,empNo,groupId } = req.body;

            if (!userId || !empNo || !groupId) {
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

              const userGroup = await prisma.userGroups.create({
                data: {
                  userId: parseInt(userId) ,
                  groupId: parseInt(groupId)
                },
                select: {
                  id: true,
                  userId: true,
                  groupId: true,
                  State: true,
                },
              });

            return res.send({
                message: 'create_user_group_success',
                data: userGroup,
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