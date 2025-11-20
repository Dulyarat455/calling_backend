/*
  Warnings:

  - You are about to drop the column `section` on the `UserSections` table. All the data in the column will be lost.
  - Added the required column `sectionId` to the `UserSections` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[CallNodes] DROP CONSTRAINT [CallNodes_sectionId_fkey];

-- AlterTable
ALTER TABLE [dbo].[UserSections] DROP COLUMN [section];
ALTER TABLE [dbo].[UserSections] ADD [sectionId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[Sections] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [State] NVARCHAR(1000) NOT NULL CONSTRAINT [Sections_State_df] DEFAULT 'use',
    CONSTRAINT [Sections_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[UserSections] ADD CONSTRAINT [UserSections_sectionId_fkey] FOREIGN KEY ([sectionId]) REFERENCES [dbo].[Sections]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CallNodes] ADD CONSTRAINT [CallNodes_sectionId_fkey] FOREIGN KEY ([sectionId]) REFERENCES [dbo].[Sections]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
