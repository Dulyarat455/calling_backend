/*
  Warnings:

  - You are about to drop the column `jobStatus` on the `TimeStateJob` table. All the data in the column will be lost.
  - Added the required column `stateJobId` to the `TimeStateJob` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[TimeStateJob] DROP COLUMN [jobStatus];
ALTER TABLE [dbo].[TimeStateJob] ADD [stateJobId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[StateJob] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [State] NVARCHAR(1000) NOT NULL CONSTRAINT [StateJob_State_df] DEFAULT 'use',
    CONSTRAINT [StateJob_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[TimeStateJob] ADD CONSTRAINT [TimeStateJob_stateJobId_fkey] FOREIGN KEY ([stateJobId]) REFERENCES [dbo].[StateJob]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
