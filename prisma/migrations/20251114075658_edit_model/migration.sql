/*
  Warnings:

  - Made the column `State` on table `CallNodes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `State` on table `Groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `State` on table `Machines` required. This step will fail if there are existing NULL values in that column.
  - Made the column `State` on table `UserGroups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `State` on table `UserSections` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[CallNodes] ALTER COLUMN [State] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Groups] ALTER COLUMN [State] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Machines] ALTER COLUMN [State] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[UserGroups] ALTER COLUMN [State] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[UserSections] ALTER COLUMN [State] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
