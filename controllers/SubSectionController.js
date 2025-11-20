const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

module.exports = {
    add: async(req,res)=>{
        try{
            const {role, name, sectionId} = req.body;

            //check Role
            if(role !== "admin"){
                return  res.status(400).send({
                    message: "Role_not_allowed",
                    });
            }

            if(!String(name).trim()){
                return res.status(400).send({ message: 'missing_required_fields' });
            }

            const existSubSection = await prisma.subSections.findFirst({
                where: {
                    State: 'use',       
                    name: name
                },
              });
              if (existSubSection) {
                return res.status(400).send({
                  message: "subsection_already_exists",
                });
              }
              const subSection =  await prisma.subSections.create({
                data: {
                    name : name
                },
              });

              const MapSection = await prisma.mapSections.create({
                
              }) 

              return res.send({
                message: 'create_subsection_success',
                subSection,
              });

        }catch(e){
            return res.status(500).send({ error: e.message }); 
        }
    },
    list: async (req,res) =>{
        try{
            const rows = await prisma.subSections.findMany({
                where: {
                    State: 'use'
                }
            })
            return res.send({results:rows})
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
    delete: async (req,res)=>{
        try{

        }catch(e){
            return res.status(500).send({ error: e.message });
        }

    }



}