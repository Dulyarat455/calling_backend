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
      const { filters, rows, exportedAt, count } = req.body || {};

      // ✅ validate
      if (!Array.isArray(rows)) {
        return res.status(400).send({ error: 'rows must be an array' });
      }
      if (rows.length === 0) {
        return res.status(400).send({ error: 'No data to export' });
      }

      // ✅ สร้างไฟล์
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Report System';
      wb.created = new Date();

      const ws = wb.addWorksheet('Report', {
        properties: { defaultRowHeight: 18 },
        views: [{ state: 'frozen', ySplit: 2 }] // freeze แถวบน
      });

      // ====== (A) ใส่ข้อมูล Filters ไว้บนหัวไฟล์ (optional) ======
      const f = filters || {};
      const filterText = [
        `ExportedAt: ${exportedAt || new Date().toISOString()}`,
        `Count: ${count ?? rows.length}`,
        `JobNo: ${f.jobNo || 'All'}`,
        `StartDate: ${f.startDate || 'All'}`,
        `EndDate: ${f.endDate || 'All'}`,
        `MachineId: ${f.machineId ?? 'All'}`,
        `FromNodeId: ${f.fromNodeId ?? 'All'}`,
        `ToNodeId: ${f.toNodeId ?? 'All'}`,
        `Shift: ${f.shift ?? 'All'}`
      ].join(' | ');

      // แถว 1 = filter summary
      ws.mergeCells('A1:N1');
      ws.getCell('A1').value = filterText;
      ws.getCell('A1').font = { bold: true };
      ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

      // ====== (B) Header row ======
      // แถว 2 = header
      const headerRowIndex = 2;

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
      ];

      ws.columns = columns;

      // เขียน header ลงแถว 2 (exceljs จะใช้ ws.columns header แต่เราจะ style ที่แถว 2)
      const headerRow = ws.getRow(headerRowIndex);
      headerRow.values = columns.map(c => c.header);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 22;

      // ใส่ border ให้ header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEFEFEF' }
        };
      });

      // ====== (C) Data rows ======
      // เริ่มจากแถว 3
      let rowIndex = headerRowIndex + 1;

      for (const r of rows) {
        // ✅ กัน missing keys
        const safe = {
          jobNo: r.jobNo ?? '',
          dateFrom: r.dateFrom ?? '',
          dateTo: r.dateTo ?? '',
          shift: r.shift ?? '',
          machine: r.machine ?? '',
          callFrom: r.callFrom ?? '',
          callTo: r.callTo ?? '',
          startTime: r.startTime ?? '',
          finishTime: r.finishTime ?? '',
          totalTime: r.totalTime ?? '',
          waitTime: r.waitTime ?? '',
          workTime: r.workTime ?? '',
          callByEmpNo: r.callByEmpNo ?? '',
          callByName: r.callByName ?? '',
          inchargeEmpNo: r.inchargeEmpNo ?? '',
          inchargeName: r.inchargeName ?? '',
        };

        const excelRow = ws.getRow(rowIndex);
        excelRow.values = columns.map(c => safe[c.key]);
        excelRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

        // border แบบตาราง
        excelRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        rowIndex++;
      }

      // ====== ส่งไฟล์กลับ ======
      const fileName = `report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await wb.xlsx.write(res);
      res.end();
    }catch(e){
      return res.status(500).send({ error: e.message });
    }

  }
  




}
