const { create } = require('domain');
const {PrismaClient} = require('../generated/prisma');
const { error } = require('console');
const prisma = new PrismaClient();
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

dotenv.config()

module.exports = {
    signin: async (req,res)=>{
        try {
            const rows = await prisma.user.findFirst({
                select: {
                    id: true,
                    empNo: true,
                    role: true,
                    name: true
                },
                where: {
                    empNo: req.body.empNo,
                    password: req.body.password,
                    accountState: 'use'
                }
            })
            if (rows != null) {
                console.log(rows);

                const key = process.env.SECRET_KEY
                const token = jwt.sign(rows, key, { expiresIn: "30d" })

                return res.send({ token: token, ...rows })
            }
            return res.status(401).send({ message: 'unauthorized' })
        } catch (e) {
            return res.status(500).send({ error: e.message })
        }
    },


    create: async(req,res)=>{
        try{

            const { userRole, role, rfId, name, password, empNo, groupId, sectionId, subSectionId  } = req.body;
            //check Role
            if (userRole !== "admin") {
                return res.status(400).send({
                message: "Role_not_allowed",
                });
            }

            if (
                name == null ||
                password == null ||
                role == null ||
                empNo == null ||
                groupId == null ||
                sectionId == null ||
                subSectionId == null ||
                rfId == null 
              ) {
                return res.status(400).send({ message: 'missing_required_fields' });
              }

            //check ซ้ำ 
            const existUser = await prisma.user.findFirst({
                where: {
                  OR: [
                    { empNo },
                    { name },
                    rfId ? { rfId } : undefined,
                  ].filter(Boolean),
                },
              });
              if (existUser) {
                return res.status(400).send({
                  message: 'user_already_exists',
                  detail: {
                    empNo: existUser.empNo === empNo,
                    name: existUser.name === name,
                    rfId: rfId ? existUser.rfId === rfId : false,
                  },
                });
              }

              const result =  await prisma.$transaction(async (tx)=> {
               const user =  await tx.user.create({
                    data:{
                        name: name,
                        password: password,
                        role: role,
                        rfId: rfId,
                        empNo: empNo,
                        status: 'active',
                        accountState: 'use'
                    }
                })
                const userGroup = await tx.userGroups.create({
                        data:{
                            userId: parseInt(user.id) ,
                            groupId: parseInt(groupId)
                        }
                })
                const userSection = await tx.userSections.create({
                    data:{
                        userId: parseInt(user.id),
                        sectionId: parseInt(sectionId),
                        subSectionId: parseInt(subSectionId)
                    }
                })
                    return {user, userGroup, userSection}
              })

            return res.send({ message: "Add user success",...result });
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },
    


    signinRfid: async (req, res) => {
        try {
            const rows = await prisma.user.findFirst({
                select: {
                    id: true,
                    empNo: true,
                    role: true,
                    name: true,
                    username: true

                },
                where: {
                    rfId: req.body.rfId,
                    status: 'use'
                }
            })
            if (rows != null) {
                console.log(rows);

                const key = process.env.SECRET_KEY
                const token = jwt.sign(rows, key, { expiresIn: "30d" })

                return res.send({ token: token, ...rows })
            }
            return res.status(401).send({ message: 'unauthorized' })
        } catch (e) {
            return res.status(500).send({ error: e.message })
        }
    },

    list: async (req,res) => {
        try{
            const rows = await prisma.user.findMany({
                select:{
                    id:true,

                },where:{
                    status: 'use'
                }
            })
        }catch(e){
            return res.status(500).send({ error: e.message })
        }
    }
}


