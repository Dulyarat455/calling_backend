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

            const { name, username, password, role, rfId, empNo } = req.body;

            if(!name || !username || !password || !role || !empNo){
                return res.status(400).send({ message: 'missing_required_fields' });
            }

            //check ซ้ำ
            const existUser = await prisma.user.findFirst({
                where: {
                  OR: [
                    { empNo },
                    { username },
                    rfId ? { rfId } : undefined,
                  ].filter(Boolean),
                },
              });
              if (existUser) {
                return res.status(400).send({
                  message: 'user_already_exists',
                  detail: {
                    empNo: existUser.empNo === empNo,
                    username: existUser.username === username,
                    rfId: rfId ? existUser.rfId === rfId : false,
                  },
                });
              }

            await prisma.user.create({
                data:{
                    name: name,
                    username: username,
                    password: password,
                    role: role,
                    rfId: rfId,
                    empNo: empNo,
                    status: 'active',
                    accountState: 'use'
                }
            })
            return res.send({ message: "create user success" });
        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },
    
    // username String
    // name String
    // password String
    // empNo String
    // role String
    // rfId String



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


