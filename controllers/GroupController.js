const {PrismaClient} = require('../generated/prisma');
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res)=>{
        try{
            const { name } = req.body;
            if(!name){
                return res.status(400).send({ message: 'missing_required_fields' });
            }
            //check ซ้ำ
            const existGroup = await prisma.groups.findFirst({
                where: {name}
              });
              if (existGroup) {
                return res.status(400).send({
                  message: 'Group_already_exists'
                });
              }

               await prisma.user.create({
                data:{
                    name: name
                }
               })
               return res.send({ message: "create new Group success" });


        }catch(e){
            return res.status(500).send({ error: e.message })
        }   
    },
    list: async (req,res)=>{

    }




}
