/*
  Warnings:

  - You are about to drop the column `closedAt` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `jobStatus` on the `Job` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Job] DROP COLUMN [closedAt],
[jobStatus];
ALTER TABLE [dbo].[Job] ADD [State] NVARCHAR(1000) NOT NULL CONSTRAINT [Job_State_df] DEFAULT 'use';

-- CreateTable
CREATE TABLE [dbo].[TimeStateJob] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL,
    [jobStatus] NVARCHAR(1000) NOT NULL,
    [jobId] INT NOT NULL,
    [userInchargeId] INT NOT NULL,
    [State] NVARCHAR(1000) NOT NULL CONSTRAINT [TimeStateJob_State_df] DEFAULT 'use',
    CONSTRAINT [TimeStateJob_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[JobRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [groupName] NVARCHAR(1000) NOT NULL,
    [machineName] NVARCHAR(1000) NOT NULL,
    [createByUserName] NVARCHAR(1000) NOT NULL,
    [remark] NVARCHAR(1000) NOT NULL,
    [fromNodeName] INT NOT NULL,
    [toNodeName] INT NOT NULL,
    [jobId] INT NOT NULL,
    [State] NVARCHAR(1000) NOT NULL CONSTRAINT [JobRecord_State_df] DEFAULT 'use',
    CONSTRAINT [JobRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Job] ADD CONSTRAINT [Job_createByUserId_fkey] FOREIGN KEY ([createByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TimeStateJob] ADD CONSTRAINT [TimeStateJob_userInchargeId_fkey] FOREIGN KEY ([userInchargeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TimeStateJob] ADD CONSTRAINT [TimeStateJob_jobId_fkey] FOREIGN KEY ([jobId]) REFERENCES [dbo].[Job]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[JobRecord] ADD CONSTRAINT [JobRecord_jobId_fkey] FOREIGN KEY ([jobId]) REFERENCES [dbo].[Job]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
