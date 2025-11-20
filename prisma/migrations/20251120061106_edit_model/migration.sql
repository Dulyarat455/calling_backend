/*
  Warnings:

  - You are about to drop the column `label` on the `CallNodes` table. All the data in the column will be lost.
  - Added the required column `subSectionId` to the `CallNodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subSectionId` to the `UserSections` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[CallNodes] DROP COLUMN [label];
ALTER TABLE [dbo].[CallNodes] ADD [subSectionId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[UserSections] ADD [subSectionId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[SubSections] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [State] NVARCHAR(1000) NOT NULL CONSTRAINT [SubSections_State_df] DEFAULT 'use',
    [createAt] DATETIME2 NOT NULL CONSTRAINT [SubSections_createAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updateAt] DATETIME2 NOT NULL CONSTRAINT [SubSections_updateAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SubSections_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[CallNodes] ADD CONSTRAINT [CallNodes_subSectionId_fkey] FOREIGN KEY ([subSectionId]) REFERENCES [dbo].[SubSections]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
