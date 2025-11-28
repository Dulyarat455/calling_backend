const { create } = require('domain');
const {PrismaClient} = require('../generated/prisma');
const { error } = require('console');
const prisma = new PrismaClient();
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

dotenv.config()

module.exports = {
    
    // signin: async (req,res)=>{
    //     try {
    //         const rows = await prisma.user.findFirst({
    //             select: {
    //                 id: true,
    //                 empNo: true,
    //                 role: true,
    //                 name: true
    //             },
    //             where: {
    //                 empNo: req.body.empNo,
    //                 password: req.body.password,
    //                 accountState: 'use'
    //             }
    //         })
    //         if (rows != null) {
    //             console.log(rows);

    //             const key = process.env.SECRET_KEY
    //             const token = jwt.sign(rows, key, { expiresIn: "30d" })

    //             return res.send({ token: token, ...rows })
    //         }
    //         return res.status(401).send({ message: 'unauthorized' })
    //     } catch (e) {
    //         return res.status(500).send({ error: e.message })
    //     }
    // },


    signin: async (req, res) => {
        try {
          const { empNo, password } = req.body;
      
          // หา user + relations เหมือน filterByOneUser
          const u = await prisma.user.findFirst({
            where: {
              empNo,
              password,            
              accountState: 'use',
            },
            include: {
              UserGroups: {
                include: { Groups: true },
              },
              UserSections: {
                include: {
                  Section: true,
                  SubSections: true,
                },
              },
            },
          });
      
          if (!u) {
            return res.status(401).send({ message: 'unauthorized' });
          }
      
          // ดึง relation ชุดแรกมา flatten (กรณี 1 user = 1 group/section/subsection)
          const group = u.UserGroups[0]?.Groups || null;
          const section = u.UserSections[0]?.Section || null;
          const subSection = u.UserSections[0]?.SubSections || null;
      
          const payload = {
            id: u.id,
            empNo: u.empNo,
            name: u.name,
            role: u.role,
            rfId: u.rfId,
            status: u.status,
            accountState: u.accountState,
      
            groupId: group?.id || null,
            groupName: group?.name || null,
      
            sectionId: section?.id || null,
            sectionName: section?.name || null,
      
            subSectionId: subSection?.id || null,
            subSectionName: subSection?.name || null,
          };
      
          // ❗ อย่าเอา password เข้า token / response
          const key = process.env.SECRET_KEY;
          const token = jwt.sign(
            {
              id: payload.id,
              empNo: payload.empNo,
              role: payload.role,
              name: payload.name,
              groupId: payload.groupId,
              sectionId: payload.sectionId,
              subSectionId: payload.subSectionId,
            },
            key,
            { expiresIn: '30d' }
          );
      
          // ส่ง token + payload ออกไปให้ frontend ใช้
          return res.send({
            token,
            ...payload,
          });
        } catch (e) {
          console.error(e);
          return res.status(500).send({ error: e.message });
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

    list: async (req, res) => {
        try {
          const users = await prisma.user.findMany({
            where: {
              accountState: 'use'
            },
            include: {
              UserGroups: {
                include: {
                  Groups: true
                }
              },
              UserSections: {
                include: {
                  Section: true,
                  SubSections: true
                }
              }
            }
          });
      
          const rows = users.map(u => {
            const group = u.UserGroups[0]?.Groups || null;
            const section = u.UserSections[0]?.Section || null;
            const subSection = u.UserSections[0]?.SubSections || null;
      
            return {
              id: u.id,
              username: u.username,
              password: u.password,
              name: u.name,
              empNo: u.empNo,
              role: u.role,
              rfId: u.rfId,
              status: u.status,
              accountState: u.accountState,
      
              // 👇 flatten fields
              groupId: group?.id || null,
              groupName: group?.name || null,
      
              sectionId: section?.id || null,
              sectionName: section?.name || null,
      
              subSectionId: subSection?.id || null,
              subSectionName: subSection?.name || null
            };
          });
      
          return res.send({results : rows});
        } catch (e) {
          console.error(e);
          return res.status(500).send({ error: e.message });
        }
      },

      filterByOneUser: async (req, res) => {
        try {
          const { userId } = req.body;
      
          // 1) validate userId
          const userIdNum = Number(userId);
          if (userId == null || Number.isNaN(userIdNum)) {
            return res.status(400).send({
              message: 'invalid_user_id',
            });
          }
      
          // 2) ดึง user คนเดียว
          const u = await prisma.user.findFirst({
            where: {
              id: userIdNum,
              accountState: 'use',
            },
            include: {
              UserGroups: {
                include: {
                  Groups: true,
                },
              },
              UserSections: {
                include: {
                  Section: true,
                  SubSections: true,
                },
              },
            },
          });
      
          // 3) ถ้าไม่เจอ
          if (!u) {
            return res.status(404).send({ message: 'user_not_found' });
          }
      
          // 4) flatten เหมือน list()
          const group = u.UserGroups[0]?.Groups || null;
          const section = u.UserSections[0]?.Section || null;
          const subSection = u.UserSections[0]?.SubSections || null;
      
          const row = {
            id: u.id,
            username: u.username,
            // ถ้าไม่อยากส่ง password ออกหน้าเว็บ แนะนำลบออก
            password: u.password,
            name: u.name,
            empNo: u.empNo,
            role: u.role,
            rfId: u.rfId,
            status: u.status,
            accountState: u.accountState,
      
            groupId: group?.id || null,
            groupName: group?.name || null,
      
            sectionId: section?.id || null,
            sectionName: section?.name || null,
      
            subSectionId: subSection?.id || null,
            subSectionName: subSection?.name || null,
          };
      
          return res.send({ result: row });
        } catch (e) {
          console.error(e);
          return res.status(500).send({ error: e.message });
        }
      }
      
}


