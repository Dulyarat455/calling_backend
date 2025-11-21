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
              const result =  await prisma.$transaction(async (tx)=> {

                const subSection =  await tx.subSections.create({
                    data: {
                        name : name
                    },
                  });
    
                  const mapSection = await tx.mapSections.create({
                    data:{
                        sectionId: parseInt(sectionId),
                        subSectionId: subSection.id
                    }
                  });
                  return { subSection, mapSection };
              })

            
              return res.send({
                message: 'create_subsection_success',
                ...result,
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
                },
                include:{
                    MapSections:{
                        include:{
                            Sections: {
                                select: {id: true, name: true}
                            }
                        }
                    }
                }
            })

            //flat data before sent
            // return res.send({results:rows})

            const result = rows.map((r) => {
                const map = r.MapSections[0];  // ดึงตัวแรก (หรือ undefined ถ้าไม่มี)
              
                return {
                  id: r.id,
                  name: r.name,
                  createAt: r.createAt, 
                  updateAt: r.updateAt,
                  section: map?.Sections?.name ?? null,
                  sectionId: map?.Sections?.id ?? null,
                };
              });

            return  res.send({ results: result});

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

    },
    filterBySection: async (req,res) =>{
        try{
            const {sectionId} = req.body;

             // 1) validate sectionId
            const sectionIdNum = Number(sectionId);
            if (!sectionId || Number.isNaN(sectionIdNum)) {
            return res.status(400).send({
                message: 'invalid_section_id',
            });
            }

           // 2) query SubSections ที่ map อยู่กับ sectionId นี้
            const rows = await prisma.subSections.findMany({
                    where: {
                    State: 'use',
                    MapSections: {
                        some: {
                        sectionId: sectionIdNum,
                        },
                    },
                    },
                    include: {
                    MapSections: {
                        include: {
                        Sections: {
                            select: { id: true, name: true },
                        },
                        },
                    },
                    },
            });


            // 3) flatten data ให้ frontend ใช้ง่าย
            const results = rows.map((r) => {
                    const map = r.MapSections[0]; // ถ้า 1 SubSection map กับ 1 Section
                    return {
                    id: r.id,
                    name: r.name,
                    state: r.State,
                    createdAt: r.createAt,
                    updateAt: r.updateAt,
                    sectionId: map?.Sections?.id ?? null,
                    section: map?.Sections?.name ?? null,
                    };
            });
            
            return res.send({ results });

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    }



}