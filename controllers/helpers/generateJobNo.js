// controllers/helpers/generateJobNo.js
module.exports = async function generateJobNo(tx) {
    const now = new Date();
  
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
  
    const prefix = `${yy}${mm}${dd}`; // YYMMDD
  
    const lastJob = await tx.job.findFirst({
      where: {
        jobNo: { startsWith: prefix },
      },
      orderBy: { jobNo: 'desc' },
    });
  
    let running = '001';
  
    if (lastJob?.jobNo) {
      const lastRun = parseInt(lastJob.jobNo.slice(-3), 10);
      running = String(lastRun + 1).padStart(3, '0');
    }
  
    return `${prefix}${running}`;
  };
  