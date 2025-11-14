/*
  Warnings:

  - Made the column `createdAt` on table `Groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updateAt` on table `Groups` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Groups] ALTER COLUMN [createdAt] DATETIME2 NOT NULL;
ALTER TABLE [dbo].[Groups] ALTER COLUMN [updateAt] DATETIME2 NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
