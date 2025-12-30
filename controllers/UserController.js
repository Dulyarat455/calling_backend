const { create } = require('domain');
const {PrismaClient} = require('../generated/prisma');
const { error } = require('console');
const prisma = new PrismaClient();
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

const ExcelJS = require('exceljs');

function norm(s) {
  return String(s ?? '').trim().toLowerCase();
}

dotenv.config()

module.exports = {
    
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

          let callNode = null;

          if (group?.id && section?.id && subSection?.id) {
            callNode = await prisma.callNodes.findFirst({
              where: {
                groupId: group.id,
                sectionId: section.id,
                subSectionId: subSection.id,
                State: 'use',
                isActive: 1,
              },
              select: {
                id: true,
                code: true,
              },
            });
          }

     
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

            callNodeId: callNode?.id ?? null,
            callNodeCode: callNode?.code ?? null,
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

            const  {rfId,} = req.body;
            const u = await prisma.user.findFirst({
              where: {
                rfId: rfId,           
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

          let callNode = null;

          if (group?.id && section?.id && subSection?.id) {
            callNode = await prisma.callNodes.findFirst({
              where: {
                groupId: group.id,
                sectionId: section.id,
                subSectionId: subSection.id,
                State: 'use',
                isActive: 1,
              },
              select: {
                id: true,
                code: true,
              },
            });
          }

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

            callNodeId: callNode?.id ?? null,
            callNodeCode: callNode?.code ?? null,
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
      },


      updateOneUser: async (req, res) => {
        try {
          const { userId, name, password, empNo, role, rfId, groupId, sectionId, subSectionId } = req.body;
      
          if (userId === undefined || userId === null) {
            return res.status(400).send({ message: "userId is required" });
          }
      
          const uid = Number(userId);
          if (Number.isNaN(uid)) {
            return res.status(400).send({ message: "userId must be a number" });
          }
      
          const DONE = 3;
          const WAIT = 1;
      
          // 1) เช็ค user มีจริงก่อน
          const user = await prisma.user.findUnique({ where: { id: uid } });
          if (!user) {
            return res.status(404).send({ message: "Not found this user in system" });
          }
      
          // =========================================================
          // CASE 1: job ที่ createByUserId === uid และ latest state != DONE => BLOCK
          // =========================================================
          const case1Jobs = await prisma.job.findMany({
            where: { createByUserId: uid, State: "use" },
            include: {
              Groups: { select: { name: true } },
              Machines: { select: { code: true } },
              fromNode: { select: { code: true } },
              toNode: { select: { code: true } },
              TimeStateJob: {
                where: { State: "use" },
                orderBy: { date: "desc" },
                take: 1,
                include: { StateJob: { select: { id: true, name: true } } },
              },
            },
          });
      
          const blockedCase1 = case1Jobs
            .filter(j => j.TimeStateJob[0]?.stateJobId !== DONE)
            .map(j => ({
              reason: "CREATE_BY_USER",
              jobId: j.id,
              createAt: j.createAt,
              jobNo: j.jobNo ?? null,
              groupName: j.Groups?.name ?? null,
              machineCode: j.Machines?.code ?? null,
              fromNode: j.fromNode?.code ?? null,
              toNode: j.toNode?.code ?? null,
              latestState: j.TimeStateJob[0]?.StateJob?.name ?? null,
              latestStateJobId: j.TimeStateJob[0]?.stateJobId ?? null,
            }));
      
          // =========================================================
          // CASE 2: หา latest state ต่อ job ที่ uid เป็น incharge
          // block เงื่อนไข: latest stateJobId != WAIT และ != DONE
          // =========================================================
          const case2LatestStates = await prisma.timeStateJob.findMany({
            where: { userInchargeId: uid, State: "use" },
            orderBy: { date: "desc" },
            distinct: ["jobId"],
            include: {
              Job: {
                include: {
                  Groups: { select: { name: true } },
                  Machines: { select: { code: true } },
                  fromNode: { select: { code: true } },
                  toNode: { select: { code: true } },
                },
              },
              StateJob: { select: { id: true, name: true } },
            },
          });
      
          const blockedCase2 = case2LatestStates
            .filter(ts => ts.stateJobId !== WAIT && ts.stateJobId !== DONE)
            .map(ts => ({
              reason: "INCHARGE",
              jobId: ts.jobId,
              jobNo: ts.Job?.jobNo ?? null,
              createAt: ts.Job.createAt,
              groupName: ts.Job?.Groups?.name ?? null,
              machineCode: ts.Job?.Machines?.code ?? null,
              fromNode: ts.Job?.fromNode?.code ?? null,
              toNode: ts.Job?.toNode?.code ?? null,
              latestState: ts.StateJob?.name ?? null,
              latestStateJobId: ts.stateJobId ?? null,
            }));
      
          // =========================================================
          // MERGE กัน job ซ้ำ (ใช้ jobId เป็น key)
          // =========================================================
          const map = new Map();
      
          for (const j of blockedCase1) {
            map.set(j.jobId, { ...j, reasons: ["CREATE_BY_USER"] });
          }
      
          for (const j of blockedCase2) {
            if (map.has(j.jobId)) {
              map.get(j.jobId).reasons.push("INCHARGE");
            } else {
              map.set(j.jobId, { ...j, reasons: ["INCHARGE"] });
            }
          }
      
          const blockedJobs = [...map.values()];
      
          // =========================================================
          // ถ้ามี blocked => ห้าม update
          // =========================================================
          if (blockedJobs.length > 0) {
            return res.status(409).send({
              canUpdate: false,
              message: "Cannot update user because there are blocked jobs",
              blocked: {
                case1_createByUser_latestNotDone: blockedCase1,
                case2_incharge_latestNotWaitOrDone: blockedCase2,
              },
              blockedJobs,
              summary: {
                totalBlocked: blockedJobs.length,
                case1: blockedCase1.length,
                case2: blockedCase2.length,
              },
            });
          }
      
          // =========================================================
          // ผ่านแล้ว => UPDATE USER
          // =========================================================
          const data = {};
          if (name !== undefined && name !== null) data.name = name;
          if (empNo !== undefined && empNo !== null) data.empNo = empNo;
          if (role !== undefined && role !== null) data.role = role;
          if (rfId !== undefined && rfId !== null) data.rfId = rfId;
          
          // NOTE: ควร hash password ในงานจริง
          if (password !== undefined && password !== null && password !== "") {
            data.password = password;
          }
          
          // 2) รับค่า group / section แบบตรง ๆ
          const gid = groupId;
          const sid = sectionId;
          const ssid = subSectionId;
          
          // 3) ถ้าไม่ได้ส่งอะไรมาเลย ค่อย return
          const nothingToUpdate =
            Object.keys(data).length === 0 &&
            gid == null &&
            sid == null &&
            ssid == null;
          
          if (nothingToUpdate) {
            return res.send({ canUpdate: true, message: "No fields to update" });
          }
          
          // 4) ทำ transaction
          const result = await prisma.$transaction(async (tx) => {
            // 4.1 update user
            const updatedUser =
              Object.keys(data).length > 0
                ? await tx.user.update({ where: { id: uid }, data })
                : await tx.user.findUnique({ where: { id: uid } });
          
            // 4.2 userGroups
            let updatedUserGroup = null;
            if (gid != null) {
              const existUG = await tx.userGroups.findFirst({
                where: { userId: uid },
              });
          
              updatedUserGroup = existUG
                ? await tx.userGroups.update({
                    where: { id: existUG.id },
                    data: { groupId: gid },
                  })
                : await tx.userGroups.create({
                    data: { userId: uid, groupId: gid },
                  });
            }
          
            // 4.3 userSections
            let updatedUserSection = null;
            if (sid != null || ssid != null) {
              if (sid == null) throw new Error("sectionId is required");
              if (ssid == null) throw new Error("subSectionId is required");
          
              const existUS = await tx.userSections.findFirst({
                where: { userId: uid },
              });
          
              updatedUserSection = existUS
                ? await tx.userSections.update({
                    where: { id: existUS.id },
                    data: { sectionId: sid, subSectionId: ssid },
                  })
                : await tx.userSections.create({
                    data: { userId: uid, sectionId: sid, subSectionId: ssid },
                  });
            }
          
            return { updatedUser, updatedUserGroup, updatedUserSection };
          });

          return res.send({
            canUpdate: true,
            message: "update user success",
            result: result,
          });
      
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },
      
      

      checkCanUpdateUser: async (req, res) => {
        try {
          const { userId } = req.body;
      
          if (!userId) {
            return res.status(400).send({ message: "userId is required" });
          }
      
          const uid = Number(userId);
          const DONE = 3;
          const WAIT = 1;
      
          // ======================
          // CASE 1: createByUser
          // ======================
          const case1Jobs = await prisma.job.findMany({
            where: {
              createByUserId: uid,
              State: "use",
            },
            include: {
              Groups: { select: { name: true } },
              Machines: { select: { code: true } },
              fromNode: { select: { code: true } },
              toNode: { select: { code: true } },
              TimeStateJob: {
                where: { State: "use" },
                orderBy: { date: "desc" },
                take: 1,
                include: {
                  StateJob: { select: { id: true, name: true } },
                },
              },
            },
          });
      
          const blockedCase1 = case1Jobs
            .filter(j => j.TimeStateJob[0]?.stateJobId !== DONE)
            .map(j => ({
              jobId: j.id,
              jobNo: j.jobNo,
              createAt: j.createAt,
              groupName: j.Groups?.name,
              machineCode: j.Machines?.code,
              fromNode: j.fromNode?.code,
              toNode: j.toNode?.code,
              latestStateId: j.TimeStateJob[0]?.stateJobId,
              latestState: j.TimeStateJob[0]?.StateJob?.name,
              reasons: ["CREATE_BY_USER"],
            }));
      
          // ======================
          // CASE 2: incharge
          // ======================
          const case2TimeStates = await prisma.timeStateJob.findMany({
            where: {
              userInchargeId: uid,
              State: "use",
            },
            orderBy: { date: "desc" },
            distinct: ["jobId"], // 👈 เอา state ล่าสุดต่อ job
            include: {
              Job: {
                include: {
                  Groups: { select: { name: true } },
                  Machines: { select: { code: true } },
                  fromNode: { select: { code: true } },
                  toNode: { select: { code: true } },
                },
              },
              StateJob: { select: { id: true, name: true } },
            },
          });
      
          const blockedCase2 = case2TimeStates
            .filter(ts => ts.stateJobId !== WAIT && ts.stateJobId !== DONE)
            .map(ts => ({
              jobId: ts.jobId,
              jobNo: ts.Job?.jobNo,
              createAt: ts.Job.createAt,
              groupName: ts.Job?.Groups?.name,
              machineCode: ts.Job?.Machines?.code,
              fromNode: ts.Job?.fromNode?.code,
              toNode: ts.Job?.toNode?.code,
              latestStateId: ts.stateJobId,
              latestState: ts.StateJob?.name,
              reasons: ["INCHARGE"],
            }));
      
          // ======================
          // MERGE (ไม่ซ้ำ jobId)
          // ======================
          const map = new Map();
      
          for (const j of blockedCase1) {
            map.set(j.jobId, j);
          }
      
          for (const j of blockedCase2) {
            if (map.has(j.jobId)) {
              map.get(j.jobId).reasons.push("INCHARGE");
            } else {
              map.set(j.jobId, j);
            }
          }
      
          const blockedJobs = [...map.values()];
      
          return res.send({
            canUpdate: blockedJobs.length === 0,
            blockedJobs,
            summary: {
              totalBlocked: blockedJobs.length,
              case1: blockedCase1.length,
              case2: blockedCase2.length,
            },
          });
      
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },


      exportExcelUsers: async (req, res) => {
        try {
          const { userRole, rows } = req.body;
    
          if (userRole !== 'admin') {
            return res.status(400).send({ message: 'Role_not_allowed' });
          }
    
          if (!Array.isArray(rows)) {
            return res.status(400).send({ message: 'rows must be an array' });
          }
    
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet('Users');
    
          // Header
          ws.columns = [
            { header: 'empNo', key: 'empNo', width: 15 },
            { header: 'name', key: 'name', width: 25 },
            { header: 'role', key: 'role', width: 12 },
            { header: 'rfId', key: 'rfId', width: 18 },
            { header: 'group', key: 'groupName', width: 15 },
            { header: 'section', key: 'sectionName', width: 12 },
            { header: 'subSection', key: 'subSectionName', width: 18 },
            { header: 'password', key: 'password', width: 18 },
            
          ];
    
          // Style header
          ws.getRow(1).font = { bold: true };
    
          // Add rows
          for (const r of rows) {
            ws.addRow({
              empNo: r.empNo ?? '',
              name: r.name ?? '',
              role: r.role ?? '',
              rfId: r.rfId ?? '',
              groupName: r.groupName ?? '',
              sectionName: r.sectionName ?? '',
              subSectionName: r.subSectionName ?? '',
              password: r.password ?? '',
            });
          }
    
          // ส่งเป็นไฟล์
          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="users-${new Date().toISOString().slice(0,10)}.xlsx"`
          );
    
          await wb.xlsx.write(res);
          res.end();
    
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },



      importExcelUsers: async (req, res) => {
        try {
          const { userRole } = req.body;
    
          // ✅ check role
          if (userRole !== 'admin') {
            return res.status(400).send({ message: 'Role_not_allowed' });
          }
    
          if (!req.file) {
            return res.status(400).send({ message: 'file_is_required' });
          }
    
          // =========================
          // helper: normalize
          // =========================
          const norm = (v) =>
            String(v ?? '')
              .trim()
              .toLowerCase()
              .replace(/\s+/g, ' ');
    
          // =========================
          // helper: checkCanUpdateUser (internal ใช้ tx)
          // =========================
          const checkCanUpdateUserInternal = async (tx, userId) => {
            const uid = Number(userId);
            const DONE = 3;
            const WAIT = 1;
    
            // CASE 1: createByUser
            const case1Jobs = await tx.job.findMany({
              where: { createByUserId: uid, State: "use" },
              include: {
                User: { select: { empNo: true, name: true } },
                Groups: { select: { name: true } },
                Machines: { select: { code: true } },
                fromNode: { select: { code: true } },
                toNode: { select: { code: true } },
                TimeStateJob: {
                  where: { State: "use" },
                  orderBy: { date: "desc" },
                  take: 1,
                  include: { StateJob: { select: { id: true, name: true } } },
                },
              },
            });
    
            const blockedCase1 = case1Jobs
              .filter(j => j.TimeStateJob[0]?.stateJobId !== DONE)
              .map(j => ({
                jobId: j.id,
                jobNo: j.jobNo,
                empNo: j.User?.empNo,     
                userName: j.User?.name,
                createAt: j.createAt, // ✅ ตรงกับ buildBlockedHtml()
                groupName: j.Groups?.name,
                machineCode: j.Machines?.code,
                fromNode: j.fromNode?.code,
                toNode: j.toNode?.code,
                latestStateId: j.TimeStateJob[0]?.stateJobId,
                latestState: j.TimeStateJob[0]?.StateJob?.name,
                reasons: ["CREATE_BY_USER"],
              }));
    
            // CASE 2: incharge
            // ✅ ดึงข้อมูล incharge user ครั้งเดียว
            const inchargeUser = await tx.user.findUnique({
              where: { id: uid },
              select: { empNo: true, name: true },
            });

            const case2TimeStates = await tx.timeStateJob.findMany({
              where: { userInchargeId: uid, State: "use" },
              orderBy: { date: "desc" },
              distinct: ["jobId"],
              include: {
                Job: {
                  include: {
                    Groups: { select: { name: true } },
                    Machines: { select: { code: true } },
                    fromNode: { select: { code: true } },
                    toNode: { select: { code: true } },
                  },
                },
                StateJob: { select: { id: true, name: true } },
              },
            });
    
            const blockedCase2 = case2TimeStates
              .filter(ts => ts.stateJobId !== WAIT && ts.stateJobId !== DONE)
              .map(ts => ({
                jobId: ts.jobId,
                jobNo: ts.Job?.jobNo,
                empNo: inchargeUser?.empNo ?? null,
                userName: inchargeUser?.name ?? null,
                createAt: ts.Job?.createAt, // ✅ ตรงกับ buildBlockedHtml()
                groupName: ts.Job?.Groups?.name,
                machineCode: ts.Job?.Machines?.code,
                fromNode: ts.Job?.fromNode?.code,
                toNode: ts.Job?.toNode?.code,
                latestStateId: ts.stateJobId,
                latestState: ts.StateJob?.name,
                reasons: ["INCHARGE"],
              }));
    
            // MERGE ไม่ซ้ำ jobId
            const map = new Map();
            for (const j of blockedCase1) map.set(j.jobId, j);
            for (const j of blockedCase2) {
              if (map.has(j.jobId)) map.get(j.jobId).reasons.push("INCHARGE");
              else map.set(j.jobId, j);
            }
    
            const blockedJobs = [...map.values()];
    
            return {
              canUpdate: blockedJobs.length === 0,
              blockedJobs,
              summary: {
                totalBlocked: blockedJobs.length,
                case1: blockedCase1.length,
                case2: blockedCase2.length,
              },
            };
          };
    
          // =========================
          // โหลด master มา map name -> id
          // =========================
          const [groups, sections, subSections] = await Promise.all([
            prisma.groups.findMany({ where: { State: 'use' }, select: { id: true, name: true } }),
            prisma.sections.findMany({ where: { State: 'use' }, select: { id: true, name: true } }),
            prisma.subSections.findMany({ where: { State: 'use' }, select: { id: true, name: true } }),
          ]);
    
          const groupMap = new Map(groups.map(g => [norm(g.name), g.id]));
          const sectionMap = new Map(sections.map(s => [norm(s.name), s.id]));
          const subSectionMap = new Map(subSections.map(ss => [norm(ss.name), ss.id]));
    
          // =========================
          // read excel
          // =========================
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(req.file.buffer);
          const ws = wb.worksheets[0];
          if (!ws) return res.status(400).send({ message: 'worksheet_not_found' });
    
          // อ่าน header row
          const headerRow = ws.getRow(1);
          const headers = {};
          headerRow.eachCell((cell, colNumber) => {
            headers[norm(cell.value)] = colNumber;
          });
    
          const requiredHeaders = ['name','empno','password','role','rfid','group','section','subsection'];
          const missingHeaders = requiredHeaders.filter(h => !headers[h]);
          if (missingHeaders.length) {
            return res.status(400).send({ message: 'missing_headers', missingHeaders });
          }
    
          // =========================
          // results + blocked accumulator (สำหรับ Swal buildBlockedHtml)
          // =========================
          const results = {
            totalRows: 0,
            created: 0,
            updated: 0,
            skippedDuplicate: 0,
            skippedBlockedUpdate: 0,
            failed: 0,
            errors: [],
          };
    
          const blockedAccumulator = {
            blockedJobs: [],
            summary: { totalBlocked: 0, case1: 0, case2: 0 },

            blockedUsers: [], // [{ userId, empNo, name }]
          };

          const blockedUserSet = new Set(); // key = userId
    
          // =========================
          // transaction ทั้งไฟล์
          // =========================
          await prisma.$transaction(async (tx) => {
            for (let r = 2; r <= ws.rowCount; r++) {
              const row = ws.getRow(r);
    
              const name = String(row.getCell(headers['name']).value ?? '').trim();
              const empNo = String(row.getCell(headers['empno']).value ?? '').trim();
              const password = String(row.getCell(headers['password']).value ?? '').trim();
              const role = String(row.getCell(headers['role']).value ?? '').trim();
              const rfId = String(row.getCell(headers['rfid']).value ?? '').trim();
    
              const groupName = String(row.getCell(headers['group']).value ?? '').trim();
              const sectionName = String(row.getCell(headers['section']).value ?? '').trim();
              const subSectionName = String(row.getCell(headers['subsection']).value ?? '').trim();
    
              // แถวว่าง -> ข้าม
              if (!name && !empNo && !password && !role && !rfId) continue;
    
              results.totalRows++;
    
              // validate required (ตามที่คุณใช้)
              const missing = [];
              if (!name) missing.push('name');
              if (!empNo) missing.push('empNo');
              if (!password) missing.push('password');
              if (!role) missing.push('role');
              if (!rfId) missing.push('rfId');
              if (!groupName) missing.push('group');
              if (!sectionName) missing.push('section');
              if (!subSectionName) missing.push('subSection');
    
              if (missing.length) {
                results.failed++;
                results.errors.push({ row: r, message: 'missing_required_fields', missing });
                continue;
              }
    
              // map name -> id
              const groupId = groupMap.get(norm(groupName));
              const sectionId = sectionMap.get(norm(sectionName));
              const subSectionId = subSectionMap.get(norm(subSectionName));
    
              if (!groupId || !sectionId || !subSectionId) {
                results.failed++;
                results.errors.push({
                  row: r,
                  message: 'master_not_found',
                  detail: {
                    group: groupId ? 'ok' : groupName,
                    section: sectionId ? 'ok' : sectionName,
                    subSection: subSectionId ? 'ok' : subSectionName,
                  }
                });
                continue;
              }


              // ✅ CALLNODE CHECK (for update + create)
            const callNodeOk = await tx.callNodes.findFirst({
              where: {
                State: 'use',
                groupId: Number(groupId),
                sectionId: Number(sectionId),
                subSectionId: Number(subSectionId),
              },
              select: { id: true },
            });

            if (!callNodeOk) {
              results.failed++;
              results.errors.push({
                row: r,
                message: 'callnode_not_found',
                empNo,
                name,
                reason: `No CallNodes mapping for groupId=${groupId}, sectionId=${sectionId}, subSectionId=${subSectionId}`,
                detail: { groupName, sectionName, subSectionName }
              });
              continue;
            }
    
              // =====================================================
              // ✅ 1) ถ้า empNo ซ้ำ -> UPDATE (แต่ต้อง check canUpdate ก่อน)
              // =====================================================
              const existByEmpNo = await tx.user.findFirst({ where: { empNo } });
    
              if (existByEmpNo) {
                const chk = await checkCanUpdateUserInternal(tx, existByEmpNo.id);
    
                if (!chk.canUpdate) {
                  // เก็บ blocked ของ user นี้ เพื่อให้ Swal ใช้ buildBlockedHtml
                  blockedAccumulator.blockedJobs.push(...chk.blockedJobs);
                  blockedAccumulator.summary.totalBlocked += chk.summary.totalBlocked;
                  blockedAccumulator.summary.case1 += chk.summary.case1;
                  blockedAccumulator.summary.case2 += chk.summary.case2;
                  
                  results.failed++;   
                  results.skippedBlockedUpdate++;


                   // ✅ เก็บ empNo + name ของ user ที่โดน block (กันซ้ำด้วย)
                  const key = String(existByEmpNo.id);
                  if (!blockedUserSet.has(key)) {
                    blockedUserSet.add(key);
                    blockedAccumulator.blockedUsers.push({
                      userId: existByEmpNo.id,
                      empNo: existByEmpNo.empNo,
                      name: existByEmpNo.name,
                    });
                  }


                  results.errors.push({
                    row: r,
                    message: 'cannot_update_user_blocked_jobs',
                    empNo,
                    name, 
                    userId: existByEmpNo.id,
                  });
                  continue;
                }
    
                // ✅ update user (เหมือน updateOneUser แนวคิด: payload เหมือน create)
                await tx.user.update({
                  where: { id: existByEmpNo.id },
                  data: {
                    name,
                    password,
                    role,
                    rfId,
                    // empNo เหมือนเดิมอยู่แล้ว
                  },
                });
    
                // ✅ update mapping group / section / subSection
                // (ทำแบบง่าย: ถ้ามี record ก็ update, ไม่มีก็ create)
                const ug = await tx.userGroups.findFirst({
                  where: { userId: existByEmpNo.id, State: 'use' },
                });
    
                if (ug) {
                  await tx.userGroups.update({
                    where: { id: ug.id },
                    data: { groupId },
                  });
                } else {
                  await tx.userGroups.create({
                    data: { userId: existByEmpNo.id, groupId },
                  });
                }
    
                const us = await tx.userSections.findFirst({
                  where: { userId: existByEmpNo.id, State: 'use' },
                });
    
                if (us) {
                  await tx.userSections.update({
                    where: { id: us.id },
                    data: { sectionId, subSectionId },
                  });
                } else {
                  await tx.userSections.create({
                    data: { userId: existByEmpNo.id, sectionId, subSectionId },
                  });
                }
    
                results.updated++;
                continue;
              }
    
              // =====================================================
              // ✅ 2) ถ้า empNo ไม่ซ้ำ -> CREATE (เหมือนเดิม)
              // แต่ต้องกัน name / rfId ซ้ำด้วย (เหมือน create เดิมของคุณ)
              // =====================================================



              const existUser = await tx.user.findFirst({
                where: {
                  OR: [
                    { name },
                    { rfId },
                  ],
                },
              });
    
              if (existUser) {
                results.skippedDuplicate++;
                results.errors.push({
                  row: r,
                  message: 'user_already_exists',
                  detail: {
                    empNo: false,
                    name: existUser.name === name,
                    rfId: existUser.rfId === rfId,
                  }
                });
                continue;
              }
    
              const user = await tx.user.create({
                data: {
                  name,
                  password,
                  role,
                  rfId,
                  empNo,
                  status: 'active',
                  accountState: 'use',
                },
              });
    
              await tx.userGroups.create({
                data: { userId: user.id, groupId }
              });
    
              await tx.userSections.create({
                data: { userId: user.id, sectionId, subSectionId }
              });
    
              results.created++;
            }
          });
    
          // =====================================================
          // ✅ ถ้ามี blocked update -> ส่งกลับเหมือน updateOneUser
          // Frontend จะใช้ buildBlockedHtml ได้ทันที
          // =====================================================
          if (blockedAccumulator.blockedJobs.length > 0) {
            return res.status(400).send({
              message: "Cannot update user because there are blocked jobs",
              canUpdate: false,
              blockedJobs: blockedAccumulator.blockedJobs,
              summary: blockedAccumulator.summary,
              // ✅ NEW: ส่งรายชื่อ user ที่โดน block
              blockedUsers: blockedAccumulator.blockedUsers,
              results,
            });
          }
    
          return res.send({
            message: 'import_excel_success',
            results,
          });
    
        } catch (e) {
          return res.status(500).send({ error: e.message });
        }
      },





     deleteUser: async (req, res) => {
      try {
          const { userId } = req.body;

          if (!userId) {
            return res.status(400).send({ message: "userId is required" });
          }

          const uid = Number(userId);
          const DONE = 3;
          const WAIT = 1;

          // ✅ ตรวจว่ามี user จริงไหม
          const checkUser = await prisma.user.findFirst({
            where: { id: uid },
            select: { id: true, empNo: true, name: true, accountState: true },
          });

          if (!checkUser) {
            return res.status(400).send({ message: "Not found this user" });
          }

          // ถ้าลบไปแล้วก็กันไว้
          if (checkUser.accountState === "delete") {
            return res.status(400).send({ message: "user_already_deleted" });
          }

          // ======================
          // CASE 1: createByUser
          // ======================
          const case1Jobs = await prisma.job.findMany({
            where: {
              createByUserId: uid,
              State: "use",
            },
            include: {
              Groups: { select: { name: true } },
              Machines: { select: { code: true } },
              fromNode: { select: { code: true } },
              toNode: { select: { code: true } },
              TimeStateJob: {
                where: { State: "use" },
                orderBy: { date: "desc" },
                take: 1,
                include: {
                  StateJob: { select: { id: true, name: true } },
                },
              },
            },
          });

          const blockedCase1 = case1Jobs
            .filter(j => j.TimeStateJob[0]?.stateJobId !== DONE)
            .map(j => ({
              jobId: j.id,
              jobNo: j.jobNo,
              createAt: j.createAt,
              groupName: j.Groups?.name,
              machineCode: j.Machines?.code,
              fromNode: j.fromNode?.code,
              toNode: j.toNode?.code,
              latestStateId: j.TimeStateJob[0]?.stateJobId,
              latestState: j.TimeStateJob[0]?.StateJob?.name,
              reasons: ["CREATE_BY_USER"],
            }));

          // ======================
          // CASE 2: incharge
          // ======================
          const case2TimeStates = await prisma.timeStateJob.findMany({
            where: {
              userInchargeId: uid,
              State: "use",
            },
            orderBy: { date: "desc" },
            distinct: ["jobId"],
            include: {
              Job: {
                include: {
                  Groups: { select: { name: true } },
                  Machines: { select: { code: true } },
                  fromNode: { select: { code: true } },
                  toNode: { select: { code: true } },
                },
              },
              StateJob: { select: { id: true, name: true } },
            },
          });

          const blockedCase2 = case2TimeStates
            .filter(ts => ts.stateJobId !== WAIT && ts.stateJobId !== DONE)
            .map(ts => ({
              jobId: ts.jobId,
              jobNo: ts.Job?.jobNo,
              createAt: ts.Job?.createAt,
              groupName: ts.Job?.Groups?.name,
              machineCode: ts.Job?.Machines?.code,
              fromNode: ts.Job?.fromNode?.code,
              toNode: ts.Job?.toNode?.code,
              latestStateId: ts.stateJobId,
              latestState: ts.StateJob?.name,
              reasons: ["INCHARGE"],
            }));

          // ======================
          // MERGE (ไม่ซ้ำ jobId)
          // ======================
          const map = new Map();

          for (const j of blockedCase1) map.set(j.jobId, j);
          for (const j of blockedCase2) {
            if (map.has(j.jobId)) map.get(j.jobId).reasons.push("INCHARGE");
            else map.set(j.jobId, j);
          }

          const blockedJobs = [...map.values()];
          const canDelete = blockedJobs.length === 0;

          // ✅ ถ้าโดน block -> ห้ามลบ (ส่ง format เดียวกับ updateOneUser ได้เลย)
          if (!canDelete) {
            return res.status(400).send({
              message: "Cannot delete user because there are blocked jobs",
              canDelete: false,              // เพิ่ม field ให้สื่อความหมาย
              canUpdate: false,              // ถ้าหน้าบ้านคุณเช็ค canUpdate อยู่ จะได้ไม่พัง
              blockedJobs,
              blockedUsers: [
                { userId: checkUser.id, empNo: checkUser.empNo, name: checkUser.name }
              ],
              summary: {
                totalBlocked: blockedJobs.length,
                case1: blockedCase1.length,
                case2: blockedCase2.length,
              },
            });
          }

          // ✅ ผ่านเงื่อนไข -> soft delete
          const updated = await prisma.user.update({
            where: { id: uid },
            data: { accountState: "delete" },
            select: { id: true, empNo: true, name: true, accountState: true },
          });

          return res.send({
            message: "delete_user_success",
            canDelete: true,
            user: updated,
          });

      } catch (e) {
        return res.status(500).send({ error: e.message });
      }
}

      
}


