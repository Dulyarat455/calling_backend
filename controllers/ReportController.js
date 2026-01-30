const { PrismaClient } = require("../generated/prisma");
const ExcelJS = require('exceljs');
const prisma = new PrismaClient();


module.exports = {
  list: async (req, res) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { State: 'use' },
        orderBy: { createAt: 'desc' },
        include: {
          Groups: true,
          Machines: true,
          fromNode: true,
          toNode: true,
          User: true,
          TimeStateJob: {
            where: { State: 'use' },
            orderBy: { date: 'asc' },
            include: {
              StateJob: true,
              User: true,
            },
          },
        },
      });
  
      // ✅ เอาเฉพาะ job ที่มี finish
      const finishJobs = jobs.filter((job) =>
        job.TimeStateJob.some(
          (ts) => (ts.StateJob?.name || '').toLowerCase() === 'finish'
        )
      );
  
      const results = finishJobs.map((job) => {
        // 1) Finish (เอาตัวแรกที่เจอ เพราะเรียง asc แล้ว ถ้ามี finish หลายอันแนะนำใช้ findLast ดูด้านล่าง)
        const finishState = job.TimeStateJob.find(
          (ts) => (ts.StateJob?.name || '').toLowerCase() === 'finish'
        );
  
        const finishStateInfo = finishState
          ? {
              date: finishState.date,
              stateJobId: finishState.stateJobId,
              stateJobName: finishState.StateJob?.name || null,
              userId: finishState.userInchargeId,
              userName: finishState.User?.name || null,
              userEmpNo: finishState.User?.empNo || null,
            }
          : null;
  
        // 2) Pending ล่าสุด (หาจาก TimeStateJob ที่เป็น pending)
        const pendingStates = job.TimeStateJob.filter(
          (ts) => (ts.StateJob?.name || '').toLowerCase() === 'pending'
        );
  
        const latestPending = pendingStates.length
          ? pendingStates[pendingStates.length - 1] // เพราะเรียง asc
          : null;
  
        const pendingStateInfo = latestPending
          ? {
              date: latestPending.date,
              stateJobId: latestPending.stateJobId,
              stateJobName: latestPending.StateJob?.name || 'pending',
              userId: latestPending.userInchargeId,
              userName: latestPending.User?.name || null,
              userEmpNo: latestPending.User?.empNo || null,
            }
          : null;
  
        return {
          jobId: job.id,
          groupId: job.groupId,
          groupName: job.Groups?.name ?? null,
  
          machineId: job.machineId,
          machineName: job.Machines?.code ?? null,
  
          fromNodeId: job.fromNodeId,
          fromNodeName: job.fromNode?.code ?? null,
  
          toNodeId: job.toNodeId,
          toNodeName: job.toNode?.code ?? null,
  
          createByUserId: job.createByUserId,
          createByuserName: job.User?.name ?? null,
          createByuserEmpNo: job.User?.empNo ?? null,
  
          createAt: job.createAt,
          jobNo: job.jobNo,
  
          userIncharge: finishStateInfo, // finish
          pendingUser: pendingStateInfo, // pending ล่าสุด (ถ้ามี)
        };
      });
  
      return res.send({ results });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },


  exportExcel: async (req, res) => {
    try {
      const { filters = {} } = req.body || {};
      const {
        jobNo,
        startDate,
        endDate,
        machineId,
        fromNodeId,
        toNodeId,
        shift,
      } = filters;
  
      // 1) where แบบเดียวกับ list() + filters
      const where = { State: 'use' };
  
      if (jobNo && String(jobNo).trim()) {
        where.jobNo = { contains: String(jobNo).trim() };
      }
      if (machineId != null) where.machineId = Number(machineId);
      if (fromNodeId != null) where.fromNodeId = Number(fromNodeId);
      if (toNodeId != null) where.toNodeId = Number(toNodeId);
  
      if (startDate || endDate) {
        where.createAt = {};
        if (startDate) where.createAt.gte = new Date(startDate + 'T00:00:00');
        if (endDate) where.createAt.lte = new Date(endDate + 'T23:59:59');
      }
  
      // 2) query jobs เหมือน list()
      const jobs = await prisma.job.findMany({
        where,
        orderBy: { createAt: 'desc' },
        include: {
          Groups: true,
          Machines: true,
          fromNode: true,
          toNode: true,
          User: true,
          TimeStateJob: {
            where: { State: 'use' },
            orderBy: { date: 'asc' },
            include: { StateJob: true, User: true },
          },
        },
      });
  
      // helper shift (เหมือน frontend)
      const getShift = (createAt) => {
        if (!createAt) return '-';
        const d = new Date(createAt);
        if (isNaN(d.getTime())) return '-';
  
        const h = d.getHours();
        const m = d.getMinutes();
        const totalMin = h * 60 + m;
  
        const A_START = 7 * 60, A_END = 15 * 60 + 10;
        const B_START = 15 * 60, B_END = 23 * 60 + 10;
        const C_START = 23 * 60, C_END = 7 * 60 + 10;
  
        if (totalMin >= A_START && totalMin <= A_END) return 'A';
        if (totalMin >= B_START && totalMin <= B_END) return 'B';
        if (totalMin >= C_START || totalMin <= C_END) return 'C';
        return '-';
      };
  
      const formatDate = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' });
      };
  
      const formatTime = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
      };
  
      const diffHHmmss = (fromIso, toIso) => {
        if (!fromIso || !toIso) return '-';
        const from = new Date(fromIso);
        const to = new Date(toIso);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) return '-';
        const diffMs = to.getTime() - from.getTime();
        if (diffMs < 0) return '-';
        const totalSeconds = Math.floor(diffMs / 1000);
        const hh = Math.floor(totalSeconds / 3600);
        const mm = Math.floor((totalSeconds % 3600) / 60);
        const ss = totalSeconds % 60;
        return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
      };
  
      // 3) filter เฉพาะที่มี finish (เหมือน list)
      let finishJobs = jobs.filter(job =>
        job.TimeStateJob.some(ts => (ts.StateJob?.name || '').toLowerCase() === 'finish')
      );
  
      // 4) filter shift (ถ้ามี)
      if (shift) {
        finishJobs = finishJobs.filter(job => getShift(job.createAt) === shift);
      }
  
      if (!finishJobs.length) {
        return res.status(400).send({ error: 'No data to export' });
      }
  
      // 5) map เหมือน list() แต่แปลงเป็น ExportRow
      const rows = finishJobs.map(job => {
        // ✅ finish: ถ้ามีหลาย finish ให้เอา "ตัวล่าสุด" (แนะนำ)
        const finishStates = job.TimeStateJob.filter(
          ts => (ts.StateJob?.name || '').toLowerCase() === 'finish'
        );
        const finishState = finishStates.length ? finishStates[finishStates.length - 1] : null;
  
        // ✅ pending ล่าสุด
        const pendingStates = job.TimeStateJob.filter(
          ts => (ts.StateJob?.name || '').toLowerCase() === 'pending'
        );
        const latestPending = pendingStates.length ? pendingStates[pendingStates.length - 1] : null;
  
        const startIso = job.createAt;
        const pendingIso = latestPending?.date || null;
        const finishIso = finishState?.date || null;
  
        return {
          jobNo: job.jobNo ?? '-',
  
          dateFrom: formatDate(startIso),
          dateTo: formatDate(finishIso),
  
          shift: getShift(startIso),
  
          machine: job.Machines?.code ?? '-',
          callFrom: job.fromNode?.code ?? '-',
          callTo: job.toNode?.code ?? '-',
  
          startTime: formatTime(startIso),
          finishTime: formatTime(finishIso),
  
          totalTime: diffHHmmss(startIso, finishIso),
          waitTime: diffHHmmss(startIso, pendingIso),
          workTime: diffHHmmss(pendingIso, finishIso),
  
          callByEmpNo: job.User?.empNo ?? '-',
          callByName: job.User?.name ?? '-',
  
          inchargeEmpNo: finishState?.User?.empNo ?? '-',
          inchargeName: finishState?.User?.name ?? '-',

          remark: job.remark ?? '',
          priority: job.priority ?? '',

        };
      });
  
      // 6) ExcelJS (ของคุณใช้ได้แล้ว แค่เปลี่ยน source rows)
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Report System';
      wb.created = new Date();
  
      const ws = wb.addWorksheet('Report', {
        properties: { defaultRowHeight: 18 },
        views: [{ state: 'frozen', ySplit: 2 }],
      });
  
      const filterText = [
        `ExportedAt: ${new Date().toISOString()}`,
        `Count: ${rows.length}`,
        `JobNo: ${jobNo || 'All'}`,
        `StartDate: ${startDate || 'All'}`,
        `EndDate: ${endDate || 'All'}`,
        `MachineId: ${machineId ?? 'All'}`,
        `FromNodeId: ${fromNodeId ?? 'All'}`,
        `ToNodeId: ${toNodeId ?? 'All'}`,
        `Shift: ${shift ?? 'All'}`
      ].join(' | ');
  
      ws.mergeCells('A1:R1');
      ws.getCell('A1').value = filterText;
      ws.getCell('A1').font = { bold: true };
  
      const columns = [
        { header: 'Job No', key: 'jobNo', width: 10 },
        { header: 'Date From', key: 'dateFrom', width: 14 },
        { header: 'Date To', key: 'dateTo', width: 14 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Area', key: 'machine', width: 14 },
        { header: 'Call From', key: 'callFrom', width: 16 },
        { header: 'Call To', key: 'callTo', width: 16 },
        { header: 'Start Time', key: 'startTime', width: 12 },
        { header: 'Finish Time', key: 'finishTime', width: 12 },
        { header: 'Total Time', key: 'totalTime', width: 12 },
        { header: 'Wait Time', key: 'waitTime', width: 12 },
        { header: 'Work Time', key: 'workTime', width: 12 },
        { header: 'Call By (EmpNo)', key: 'callByEmpNo', width: 16 },
        { header: 'Call By (Name)', key: 'callByName', width: 18 },
        { header: 'Incharge (EmpNo)', key: 'inchargeEmpNo', width: 18 },
        { header: 'Incharge (Name)', key: 'inchargeName', width: 18 },
        { header: 'Remark', key: 'remark', width: 28 },
        { header: 'Priority', key: 'priority', width: 12 },
      ];
      ws.columns = columns;
  
      const headerRow = ws.getRow(2);
      headerRow.values = columns.map(c => c.header);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.eachCell(cell => {
        cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFEFEFEF' } };
      });
  
      let rowIndex = 3;
      for (const r of rows) {
        const excelRow = ws.getRow(rowIndex++);
        excelRow.values = columns.map(c => r[c.key] ?? '');
        excelRow.eachCell(cell => {
          cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
        });
      }
  
      const fileName = `report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
  
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  
      await wb.xlsx.write(res);
      res.end();
  
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  }
  
  



}
