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
            await prisma.user.create({
                data:{
                    name: req.body.name,
                    username: req.body.username,
                    password: req.body.password,
                    role: req.body.role,
                    rfId: req.body.rfId,
                    empNo: req.body.empNo,
                    status: 'active'
                }
            })
            return res.send({ message: "create user success" });
        }catch(e){
            return res.status(500).send({ error: e.message });
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


